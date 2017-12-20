module.exports = (options, req) => ({
  entry: './src/index.js',
  html: {
    title: 'Wyvern Exchange',
    description: 'Decentralized digital item exchange',
    template: 'src/index.ejs'
  },
  webpack (config) {
    config.module.noParse = []
    config.module.noParse.push(/dtrace-provider$/)
    config.module.noParse.push(/safe-json-stringify$/)
    config.node = {fs: 'empty'}
    return config
  }
})
