const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'development', // Change to 'production' for production builds
    entry: './js/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    resolve: {
        extensions: ['.js']
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
                core: {
                    test: /[\\/]js[\\/]core[\\/]/,
                    name: 'core',
                    chunks: 'all',
                    enforce: true,
                },
                utils: {
                    test: /[\\/]js[\\/]utils[\\/]/,
                    name: 'utils',
                    chunks: 'all',
                    enforce: true,
                },
                components: {
                    test: /[\\/]js[\\/]components[\\/]/,
                    name: 'components',
                    chunks: 'all',
                    enforce: true,
                }
            }
        },
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: false, // Keep console logs for debugging
                    },
                },
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    devtool: 'source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, '.'),
        },
        compress: true,
        port: 9001,
        hot: true,
        open: true,
        proxy: [
            {
                context: ['/api'],
                target: 'http://localhost:3060',
                changeOrigin: true
            }
        ]
    },
    performance: {
        hints: 'warning',
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};

