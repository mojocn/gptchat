import {defineDocumentType, makeSource} from 'contentlayer/source-files'

const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => {
      return `${doc._raw.flattenedPath}`
    },
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
}

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `**/*.md`,
  fields: {
    title: {type: 'string', required: true},
    description: {type: 'string', required: true},
    date: {type: 'date', required: true},
  },
  computedFields,

}))

export default makeSource({contentDirPath: '__posts', documentTypes: [Post]})
