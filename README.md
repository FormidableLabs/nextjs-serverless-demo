Next.js Serverless Demo
=======================

Deploy Next.js to AWS Lambda using the Serverless Application Framework.

_Based on the fine work in [nextjs-fargate-demo](https://github.com/FormidableLabs/nextjs-fargate-demo)_

## Requirements

- [Nodejs](https://nodejs.org/en/download/) 12.16+ or higher
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [AWS CLI V2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [Terraform 13.5](https://www.terraform.io/downloads.html) (exact version)

## Building

### Local Development

```sh
$ yarn dev
```

### Production Server

This repo _doesn't_ use the prod server, but if you want to create it, here you go:

#### Production build

```sh
$ yarn build
$ yarn start
```

### Serverless

TODO: IMPLEMENT SERVERLESS
