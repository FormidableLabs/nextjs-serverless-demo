import fs from 'fs'
import { promisify } from 'util'
import path from 'path'
import matter from 'gray-matter'
import remark from 'remark'
import html from 'remark-html'

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const postsDirectory = path.join(process.cwd(), 'posts')

export async function getSortedPostsData() {
  const start = new Date(); // TODO(FS)

  // Get file names under /posts
  const fileNames = await readdir(postsDirectory)
  const allPostsData = await Promise.all(fileNames.map(async fileName => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName)
    // TODO: On not found, wrap ENOENT and push back to a 404.
    const fileContents = await readFile(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents)

    // Combine the data with the id
    return {
      id,
      ...matterResult.data
    }
  }))

  console.log(JSON.stringify({
    msg: "getSortedPostsData time", // TODO REMOVE
    elapsedMs: new Date() - start
  }, null, 2));
  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export async function getAllPostIds() {
  const start = new Date();
  const fileNames = await readdir(postsDirectory)
  console.log(JSON.stringify({
    msg: "getAllPostIds time", // TODO REMOVE
    elapsedMs: new Date() - start
  }, null, 2));
  return fileNames.map(fileName => {
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    }
  })
}

export async function getPostData(id) {
  const start = new Date();
  const fullPath = path.join(postsDirectory, `${id}.md`)
  const fileContents = await readFile(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content)
  const contentHtml = processedContent.toString()

  console.log(JSON.stringify({
    msg: "getPostData time", // TODO REMOVE
    elapsedMs: new Date() - start
  }, null, 2));

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...matterResult.data
  }
}
