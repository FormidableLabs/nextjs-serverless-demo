Next.js Serverless Demo
=======================

Deploy Next.js to AWS Lambda using the Serverless Application Framework.

_Based on the fine work in _

## Project notes

This demo uses the following tools:

- [Nodejs](https://nodejs.org/en/download/) 12.16+ or higher
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [AWS CLI V2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [Terraform 13.5](https://www.terraform.io/downloads.html) (exact version)

and is based on the following projects:

- [nextjs-fargate-demo](https://github.com/FormidableLabs/nextjs-fargate-demo): We deploy the same Next.js application.
- [aws-lambda-serverless-reference][]: The CloudFormation/Terraform infrastructure approach is basically identical to our reference Serverless project.

## Local development

Start with:

```sh
$ yarn install
```

### Development server

```sh
$ yarn dev
```

### Production server

This repo _doesn't_ use the prod server, but if you want to create it, here you go:

```sh
$ yarn build
$ yarn start
```

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






[aws-lambda-serverless-reference]: https://github.com/FormidableLabs/aws-lambda-serverless-reference