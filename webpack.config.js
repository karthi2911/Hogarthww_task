const webpack = require('webpack');
const path = require('path');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const buildDirectory = path.resolve(__dirname, 'build');
const isDevelopment = process.env.NODE_ENV !== 'production';
const dotenv = require('dotenv').config();

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8000;
const generateManifest = process.env.GENERATE_MANIFEST === 'true';
const generateBuildSourceMap = process.env.GENERATE_BUILD_SOURCEMAP === 'true';
const analyzeBundle = process.env.ANALYZE_BUNDLE === 'true';

const enableHMR = isDevelopment;
const generateCSSSourceMap = isDevelopment || generateBuildSourceMap;
const WebpackAssetsManifest =
  generateManifest && require('webpack-assets-manifest');
const BundleAnalyzerPlugin =
  analyzeBundle && require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const ClearConsolePlugin = function() {};
ClearConsolePlugin.prototype.apply = function(compiler) {
  compiler.plugin('watch-run', function(compilation, callback) {
    process.stdout.write(
      process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H'
    );
    callback();
  });
};

const rules = [
  {
    test: /\.js$/,
    include: path.resolve(__dirname, 'src'),
    loader: 'babel-loader',
    sideEffects: false, //Helps tree shaking
    options: {
      cacheDirectory: true
    }
  },
  {
    test: /\.(html)$/,
    use: {
      loader: 'html-loader',
      options: {
        attrs: [':src', ':data-src', ':data-srcset', ':srcset', ':poster']
      }
    }
  },
  {
    test: /\.css$/,
    use: [
      //minimize css in prod build to avoid bundling newline chars in js chunk
      {
        loader: isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
        options: isDevelopment ? {} : { publicPath: '../' }
      },
      {
        loader: 'css-loader',
        options: { sourceMap: generateCSSSourceMap }
      }
    ]
  },
  {
    test: /\.(sass|scss)$/,
    use: [
      //minimize css in prod build to avoid bundling newline chars in js chunk
      {
        loader: isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
        options: isDevelopment ? {} : { publicPath: '../' }
      },
      {
        loader: 'css-loader',
        options: { sourceMap: generateCSSSourceMap }
      },
      {
        loader: 'postcss-loader',
        options: { sourceMap: generateCSSSourceMap }
      },
      { loader: 'sass-loader', options: { sourceMap: generateCSSSourceMap } }
    ]
  },
  {
    test: /\.(jpe?g|png|gif|webp|svg)$/,
    use: {
      loader: 'file-loader',
      options: {
        name: 'img/[name].[hash:8].[ext]',
        esModule: false
      }
    }
  },
  {
    test: /\.(woff|woff2|ttf|eot)$/,
    use: {
      loader: 'file-loader',
      options: {
        name: 'img/[name].[hash:8].[ext]',
        esModule: false
      }
    }
  }
];

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    )
  }),
  ...glob.sync(path.resolve(__dirname, 'src/*.html')).map(
    file =>
      new HtmlWebpackPlugin({
        template: file,
        filename: path.basename(file),
        favicon: path.resolve(__dirname, 'src/img/favicon.png'),
        minify: false
      })
  ),
  // Prevent importing all moment locales
  // You can remove this if you don't use Moment.js:
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
];

generateManifest &&
  plugins.push(
    new WebpackAssetsManifest({
      output: path.resolve(buildDirectory, 'webpack-manifest.json'),
      writeToDisk: true
    })
  );

analyzeBundle &&
  plugins.push(
    new BundleAnalyzerPlugin({
      openAnalyzer: true
    })
  );

const devPlugins = enableHMR
  ? [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new ClearConsolePlugin()
    ]
  : new Array();

const buildPlugins = [
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: 'style/[name].[contenthash:20].css'
  })
];

module.exports = {
  mode: isDevelopment ? 'development' : 'production',

  entry: {
    main: path.resolve(__dirname, 'src/js')
  },

  output: {
    path: buildDirectory,
    //HMR requires [hash]. It doesn't work with [chunkhash]
    filename: enableHMR
      ? 'js/[name].[hash:20].js'
      : 'js/[name].[chunkhash:20].js',
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info =>
      path
        .relative(path.resolve('src'), info.absoluteResourcePath)
        .replace(/\\/g, '/')
  },

  module: {
    rules: rules
  },

  optimization: {
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/].+\.js$/,
          name: 'vendor',
          priority: -10
        },
        styles: {
          test: /\.(scss|css)$/,
          name: 'main'
        }
      }
    },
    runtimeChunk: {
      name: 'manifest'
    }
  },

  devtool: isDevelopment
    ? 'cheap-module-source-map'
    : generateBuildSourceMap
    ? 'source-map'
    : false,

  plugins: isDevelopment
    ? [].concat(plugins, devPlugins)
    : [].concat(plugins, buildPlugins),

  resolve: {
    alias: {
      js: path.resolve(__dirname, 'src/js'),
      style: path.resolve(__dirname, 'src/style'),
      img: path.resolve(__dirname, 'src/img')
    }
  },

  devServer: {
    host: host,
    port: port,
    disableHostCheck: true,
    inline: true,
    hot: enableHMR,
    compress: true,
    stats: 'errors-only',
    overlay: true,
    /* serve html routes without html extension */
    historyApiFallback: {
      rewrites: [
        {
          from: /.*/,
          to: context => `${context.parsedUrl.pathname}.html`
        }
      ]
    }
  },

  stats: 'minimal',

  watchOptions: {
    ignored: /(node_modules)/
  }
};
