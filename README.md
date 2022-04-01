Next.js Serverless Demo
=======================

Deploy Next.js to AWS Lambda using the Serverless Application Framework.

## Project notes

This demo uses the following tools:

- [Nodejs](https://nodejs.org/en/download/) 12.16+ or higher
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [AWS CLI V2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [Terraform 13.5](https://www.terraform.io/downloads.html) (exact version)

and is based on the following projects:

- [nextjs-fargate-demo](https://github.com/FormidableLabs/nextjs-fargate-demo): We deploy the same Next.js application.
- [aws-lambda-serverless-reference][]: The CloudFormation/Terraform infrastructure approach is basically identical to our reference Serverless project.

### Goals

The main goals of this demo project are as follows:

1. **Slim down a Next.js Lambda deployment**: The Next.js `target: "serverless"` Node.js outputs are huge. Like really, really big because **each page** contains **all the dependencies**. This project aims to use  `target: "server"` Node.js outputs to achieve a smaller package.

    Here's our starting point with `serverless` target:

    ```sh
    $ yarn clean && yarn build && yarn lambda:sls package --report
    $ du -sh .serverless/blog.zip && zipinfo -1 .serverless/blog.zip | wc -l
    4.0M	.serverless/blog.zip
    290
    $ du -sh .next/serverless/pages/index.js
    2.7M	.next/serverless/pages/index.js
    ```

    Here's with `server` target:

    ```sh
    $ yarn clean && yarn build && yarn lambda:sls package --report
    $ du -sh .serverless/blog.zip && zipinfo -1 .serverless/blog.zip | wc -l
    3.0M	.serverless/blog.zip
    1291
    $ du -sh .next/server/pages/index.js
    12K	.next/server/pages/index.js
    ```

    While the package sizes at 2 pages are comparable for the overall zip, the `server` (12K) vs `serverless` (2.7M) per page cost of `pages/index.js`, and each additional page, becomes apparent.


2. **Single Lambda/APIGW proxy**: The Next.js `target: "serverless"` requires you to either manually create a routing solution based on Next.js generated metadata files or use something like [next-routes](https://github.com/fridays/next-routes). However, `target: "server"` contains a router itself for one endpoint. Thus, by using the `server` target we can avoid one of the biggest pains of deploying to a single Lambda target for an entire Next.js application.

### Caveats

Some caveats:

1. **Static files**: To make this demo a whole lot easier to develop/deploy, we handle serve static assets _from_ the Lambda. This is not what you should do for a real application. Typically, you'll want to stick those assets in an S3 bucket behind a CDN or something. Look for the `TODO(STATIC)` comments variously throughout this repository to see all the shortcuts you should unwind to then reconfigure for static assets "the right way".
2. **Deployment URL base path**: We have the Next.js blog up at sub-path `/blog`. A consumer app may go instead for root and that would simplify some of the code we have in this repo to make all the dev + prod experience work the same.
3. **Lambda SSR + CDN**: Our React SSR hasn't been tuned at all yet for caching in the CDN like a real world app would want to do.

## Local development

Start with:

```sh
$ yarn install
```

Then we provide a lot of different ways to develop the server.

| Command           | URL                                            |
| ----------------- | ---------------------------------------------- |
| `dev`             | http://127.0.0.1:3000/blog/                    |
|                   | http://127.0.0.1:3000/blog/posts/ssg-ssr       |
| `start`           | http://127.0.0.1:4000/blog/                    |
|                   | http://127.0.0.1:4000/blog/posts/ssg-ssr       |
| `lambda:localdev` | http://127.0.0.1:5000/blog/                    |
|                   | http://127.0.0.1:5000/blog/posts/ssg-ssr       |
| _deployed_        | https://nextjs-sls-sandbox.formidable.dev/blog/ |
|                   | https://nextjs-sls-sandbox.formidable.dev/blog/posts/ssg-ssr |

### Next.js Development server (3000)

The built-in Next.js dev server, compilation and all.

```sh
$ yarn dev
```

and visit: http://127.0.0.1:3000/blog/

###  Node.js production server (4000)

We have a Node.js custom `express` server that uses _almost_ all of the Lambda code, which is sometimes an easier development experience that `serverless-offline`. This also could theoretically serve as a real production server on a bare metal or containerized compute instance outside of Lambda.

```sh
$ yarn clean && yarn build
$ yarn start
```

and visit: http://127.0.0.1:4000/blog/

### Lambda development server (5000)

This uses `serverless-offline` to simulate the application running on Lambda.

```sh
$ yarn clean && yarn build
$ yarn lambda:localdev
```

and visit: http://127.0.0.1:5000/blog/

## Deployment

We target AWS via a simple command line deploy. For a real world application, you'd want to have this deployment come from your CI/CD pipeline with things like per-PR deployments, etc. However, this demo is just here to validate Next.js running on Lambda, so get yer laptop running and fire away!

### Names, groups, etc.

**Environment**:

Defaults:

- `SERVICE_NAME=nextjs-serverless`: Name of our service.
- `AWS_REGION=us-east-1`: Region
- `STAGE=localdev`: Default for local development on your machine.

For deployment, switch the following variables:

- `STAGE=sandbox`: Our cloud sandbox. We will assume you're deploying here for the rest of this guide.

**IAM Groups**:

As usual, these are the groups to attach in IAM:

- `tf-${SERVICE_NAME}-${STAGE}-admin`: Can create/delete/update the Severless app.
- `tf-${SERVICE_NAME}-${STAGE}-developer`: Can deploy the Severless app.
- `tf-${SERVICE_NAME}-${STAGE}-ci`: Can deploy the Severless app.

### Prepare tools

We need the tooling setup from [aws-lambda-serverless-reference][]. Here are some brief notes:

*Get the AWS CLI*

```sh
$ brew install awscli
$ aws --version
aws-cli/2.1.15 Python/3.9.1 Darwin/19.6.0 source/x86_64 prompt/off
```

*Get Terraform tools*

```sh
$ brew install tfenv
$ tfenv install
```

*Get AWS vault*

```sh
$ brew install aws-vault
```

### Bootstrap the project

This section only needs to be run **once** by an AWS superuser to set up the initial cloud infrastructure.

#### Provision AWS backend

Our CloudFormation code in `aws/` provisions backend services for Terraform to store state in.

**Create** the CloudFormation stack:

```sh
# Provision stack.
$ STAGE=sandbox aws-vault exec FIRST.LAST -- \
  yarn cf:bootstrap:create

# Check status until reach `CREATE_COMPLETE`
$ STAGE=sandbox aws-vault exec FIRST.LAST -- \
  yarn cf:bootstrap:status
"CREATE_COMPLETE"
```

See the [aws-lambda-serverless-reference][] docs for additional CloudFormation (`yarn cf:*`) tasks you can run.

#### Provision Terraform backend

Our Terraform code in `terraform/` provisions Terraform resources to support the Serverless application.

**Init** your local Terraform state.

```sh
$ STAGE=sandbox aws-vault exec FIRST.LAST -- \
  yarn tf:service:init --reconfigure
```

> ⚠️ **Warning**: You need to run `yarn run tf:service:init` **every** time you change `STAGE`. We suggest using the `--reconfigure` flag **every** time you run `init` to make sure that you're in the right state and backend.

> ℹ️ **Note**: The following commands require `--no-session` for `aws-vault` because they deal with IAM stuff that requires extra privileges.

**Plan** the Terraform stack.

```sh
$ STAGE=sandbox aws-vault exec FIRST.LAST --no-session -- \
  yarn run tf:service:plan
```

**Apply** the Terraform stack:

This creates / updates as appropriate.

```sh
# Type in `yes` to go forward
$ STAGE=sandbox aws-vault exec FIRST.LAST --no-session -- \
  yarn tf:service:apply
```

See the [aws-lambda-serverless-reference][] docs for additional CloudFormation (`yarn tf:*`) tasks you can run.

### Deploy to Lambda

Once the base infrastructure is in place, we will use `serverless` to deploy to AWS Lambda.

We use AWS IAM users with different privileges for these commands. `FIRST.LAST-admin` can create/delete/deploy the Serverless app. `FIRST.LAST-developer` can only deploy the Serverless app but not create/delete resources.

> ℹ️ **Note**: The `-admin|-developer` groups were created in the Terraform provisioning step and you must then attach them to separately created appropriate IAM users. At Formidable, we have an internal operations repository that manages these users and associates the groups created in this project.

**Create** the Lambda app. The first time through a `deploy`, an `-admin` user
is required (to effect the underlying CloudFormation changes).

```sh
# Build for production.
$ yarn clean && yarn build

# Deploy
$ STAGE=sandbox aws-vault exec FIRST.LAST-admin -- \
  yarn lambda:deploy

# Check on app and endpoints.
$ STAGE=sandbox aws-vault exec FIRST.LAST-admin -- \
  yarn lambda:info
```

**Deploy** the Lambda app. Use the exact same steps as above, just with either an `-admin` or `-developer` user.

See the [aws-lambda-serverless-reference][] docs for additional Serverless/Lambda (`yarn lambda:*`) tasks you can run.

As a useful helper we've separately hooked up a custom domain for `STAGE=sandbox` at:

https://nextjs-sls-sandbox.formidable.dev/blog/

> ℹ️ **Note**: We set `BASE_PATH` to `/blog` and _not_ `/${STAGE}/blog` like API Gateway does for internal endpoints for our references to other static assets. It's kind of a moot point because frontend assets shouldn't be served via Lambda/APIGW like we do for this demo, but just worth noting that the internal endpoints will have incorrect asset paths.

[aws-lambda-serverless-reference]: https://github.com/FormidableLabs/aws-lambda-serverless-reference
[aws-vault]: https://github.com/99designs/aws-vault
