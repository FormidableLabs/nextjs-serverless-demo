/* eslint-disable func-style */
import React from "react";
import Layout from "../../components/layout";

export default function Post() {
  return (
    <Layout>
      hi
    </Layout>
  );
}

Post.getInitialProps = () => {
  return Promise.resolve({});
}