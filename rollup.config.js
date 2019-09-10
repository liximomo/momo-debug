import * as path from 'path';
// import filesize from 'rollup-plugin-filesize';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';

const builds = {
  'umd-dev': {
    outFile: 'momo-debug.js',
    format: 'umd',
    mode: 'development',
  },
  'umd-prod': {
    outFile: 'momo-debug.min.js',
    format: 'umd',
    mode: 'production',
  },
};

function getAllBuilds() {
  return Object.keys(builds).map(key => genConfig(builds[key]));
}

function genConfig({ outFile, format, mode }) {
  const isProd = mode === 'production';
  return {
    input: './src/index.ts',
    output: {
      file: path.join('./dist', outFile),
      format: format,
      globals: {
        vue: 'Vue',
      },
      exports: 'named',
      name: format === 'umd' ? 'MomoDebug' : undefined,
    },
    plugins: [
      typescript({
        typescript: require('typescript'),
      }),
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(
          isProd ? 'production' : 'development'
        ),
      }),
      isProd && terser({
        compress: {
          drop_console: false,
          drop_debugger: false,
        }
      }),
    ].filter(Boolean),
  };
}

let buildConfig;

if (process.env.TARGET) {
  buildConfig = genConfig(builds[process.env.TARGET]);
} else {
  buildConfig = getAllBuilds();
}

export default buildConfig;
