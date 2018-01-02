var GitRevisionPlugin = require('git-revision-webpack-plugin')
var gitRevisionPlugin = new GitRevisionPlugin()
var webpack = require('webpack')

module.exports = (options, req) => ({
  entry: './src/index.js',
  html: {
    title: 'Wyvern Exchange',
    description: 'Autonomously governed decentralized digital item exchange',
    template: 'src/index.ejs'
  },
  webpack (config) {
    config.module.noParse = []
    config.module.noParse.push(/dtrace-provider$/)
    config.module.noParse.push(/safe-json-stringify$/)
    config.plugins.push(new webpack.DefinePlugin({
      'VERSION': JSON.stringify(gitRevisionPlugin.version()),
      'COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
      'BRANCH': JSON.stringify(gitRevisionPlugin.branch())
    }))
    config.node = {fs: 'empty'}
    return config
  }
})
