Next.js Serverless Demo
=======================

Deploy Next.js to AWS Lambda using the Serverless Application Framework.

## Project notes

This demo uses the following tools:

- [Nodejs](https://nodejs.org/en/download/) 12.16+ or higher
- [Yarn](https://classic.yarnpkg.com/en/docs/install)

and is based on the following projects:

- [nextjs-fargate-demo](https://github.com/FormidableLabs/nextjs-fargate-demo): We deploy the same Next.js application.
- [aws-lambda-serverless-reference][]: A reference Serverless Application Framework project with additional Terraform support for IAM permission boundaries.

## Goals

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

## Implementation

### Runtime

We use the production-only Node server found in `next/dist/server/next-server.js` instead of the development augmented core server found in `next/dist/server/next.js`. This has a few extra constraints, but ends up being a good choice for the following reasons:

- Both `next-server.js` and `next.js` get to use the built-in Next.js router that is unavailable when using `serverless` target.
- The traced file bundle for `next-server.js` is much slimmer as tracing can easily skip build dependencies like `webpack`, `babel`, etc. that come in with `next.js`
- Next.js itself now follows this exact model for their [experimental tracing support](https://nextjs.org/docs/advanced-features/output-file-tracing) and we can see a similar server configuration [here](https://unpkg.com/browse/next@12.1.4/dist/build/utils.js).

### Packaging

We package only the individual files needed at runtime in our Lambda using the Serverless Application Framework with the [serverless-jetpack](https://github.com/FormidableLabs/serverless-jetpack) plugin. The Jetpack plugin examines all the application entry points and then traces all imports and then creates a zip bundle of only the files that will be needed at runtime.

For those doing their own Lambda deployments (say with Terraform), we provide a standalone CLI, [trace-pkg](https://github.com/FormidableLabs/trace-pkg), to produce traced zip bundles from entry points.

Part of the underlying bundle size problem is that the `next` package ships with a ton of build-time and development-only dependencies that artificially inflate the size of a bundle suitable for application deployment. By using the `next-server.js` runtime and file tracing, we get the smallest possible package for cloud deployment that is still correct.

To read more about file tracing and integration with your applications, see

- [Jetpack: trace your way to faster and smaller Serverless packages](https://formidable.com/blog/2020/jetpack-trace-your-way-to-faster-and-smaller-serverless-packages/)
- [trace-pkg: Package Node.js apps for AWS Lambda and beyond](https://formidable.com/blog/2020/trace-pkg-package-node-js-apps-for-aws-lambda-and-beyond/)

## Caveats

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

We target AWS via a simple command line deploy using the `serverless` CLI. For a real world application, you'd want to have this deployment come from your CI/CD pipeline with things like per-PR deployments, etc. However, this demo is just here to validate Next.js running on Lambda, so get yer laptop running and fire away!

### Names, groups, etc.

**Environment**:

Defaults:

- `SERVICE_NAME=nextjs-serverless`: Name of our service.
- `AWS_REGION=us-east-1`: Region
- `STAGE=localdev`: Default for local development on your machine.

For deployment, switch the following variables:

- `STAGE=sandbox`: Our cloud sandbox. We will assume you're deploying here for the rest of this guide.

### Prepare tools

*Get AWS vault*

This allows us to never have decrypted credentials on disk.

```sh
$ brew install aws-vault
```

We will assume you have an `AWS_USER` configured that has privileges to do the rest of the cloud provisioning needed for the Serverless application deployment.

### Deploy to Lambda

We will use `serverless` to deploy to AWS Lambda.

**Deploy** the Lambda app.

```sh
# Build for production.
$ yarn clean && yarn build

# Deploy
$ STAGE=sandbox aws-vault exec AWS_USER -- \
  yarn lambda:deploy

# Check on app and endpoints.
$ STAGE=sandbox aws-vault exec AWS_USER -- \
  yarn lambda:info
```

See the [aws-lambda-serverless-reference][] docs for additional Serverless/Lambda (`yarn lambda:*`) tasks you can run.

As a useful helper we've separately hooked up a custom domain for `STAGE=sandbox` at:

https://nextjs-sls-sandbox.formidable.dev/blog/

> ℹ️ **Note**: We set `BASE_PATH` to `/blog` and _not_ `/${STAGE}/blog` like API Gateway does for internal endpoints for our references to other static assets. It's kind of a moot point because frontend assets shouldn't be served via Lambda/APIGW like we do for this demo, but just worth noting that the internal endpoints will have incorrect asset paths.

[aws-lambda-serverless-reference]: https://github.com/FormidableLabs/aws-lambda-serverless-reference
[aws-vault]: https://github.com/99designs/aws-vault

## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.
