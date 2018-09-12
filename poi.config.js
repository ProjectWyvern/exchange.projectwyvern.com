var GitRevisionPlugin = require('git-revision-webpack-plugin')
var gitRevisionPlugin = new GitRevisionPlugin()
var webpack = require('webpack')

/*
var PrerenderSpaPlugin = require('prerender-spa-plugin')
var path = require('path')
*/

module.exports = (options, req) => ({
  transformModules: ['ethereumjs-util', 'wyvern-schemas', 'lru_map', 'wyvern-exchange', 'typed-promisify', 'vuex-persist'],
  entry: './src/index.js',
  html: {
    title: 'Wyvern Exchange',
    description: 'Decentralized digital asset exchange running on the Wyvern Protocol. Buy, sell, or auction any asset representable on the Ethereum blockchain, from virtual kittens to ERC721 tokens to smart contracts.',
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
    /*
    config.plugins.push(new PrerenderSpaPlugin(
      path.resolve(__dirname, './dist'),
      ['/', '/orders/find', '/orders/post', '/directory', '/schemas', '/stats', '/about', '/help'],
      {
        captureAfterTime: 5000
      }
    ))
    */
    config.node = {fs: 'empty'}
    return config
  }
})
