'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { minify: minifyHtml } = require('html-minifier-terser');
const { transform } = require('esbuild');

const projectDirectory = path.resolve(__dirname, '..');
const outputDirectory = path.resolve(projectDirectory, 'dist');
const requiredProjectFiles = [
  'index.html',
  'wallpaper-engine.html',
  'LivelyProperties.json',
  '_LivelyInfo.json',
  'thumbnail.jpg',
  'preview.gif',
  'LICENSE',
];
const javascriptFiles = ['theme.js', 'starfield.js', 'title-effects.js'];
const htmlMinifierOptions = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  minifyCSS: true,
  minifyJS: true,
  removeComments: true,
};

async function copyProjectFiles() {
  const outputFilesDirectory = path.join(outputDirectory, 'files');

  await fs.cp(path.join(projectDirectory, 'files'), outputFilesDirectory, {
    recursive: true,
  });

  for (const fileName of requiredProjectFiles) {
    const sourcePath = path.join(projectDirectory, fileName);
    const destinationPath = path.join(outputDirectory, fileName);

    if (fileName.endsWith('.html')) {
      const sourceHtml = await fs.readFile(sourcePath, 'utf8');
      const optimizedHtml = await minifyHtml(sourceHtml, htmlMinifierOptions);

      await fs.writeFile(destinationPath, optimizedHtml, 'utf8');
      continue;
    }

    if (fileName.endsWith('.json')) {
      const sourceJson = await fs.readFile(sourcePath, 'utf8');
      const optimizedJson = JSON.stringify(JSON.parse(sourceJson));

      await fs.writeFile(destinationPath, optimizedJson, 'utf8');
      continue;
    }

    await fs.copyFile(sourcePath, destinationPath);
  }
}

async function optimizeClientAssets() {
  const filesDirectory = path.join(projectDirectory, 'files');
  const outputFilesDirectory = path.join(outputDirectory, 'files');

  for (const fileName of javascriptFiles) {
    const sourcePath = path.join(filesDirectory, fileName);
    const destinationPath = path.join(outputFilesDirectory, fileName);
    const sourceCode = await fs.readFile(sourcePath, 'utf8');
    const result = await transform(sourceCode, {
      loader: 'js',
      minify: true,
      sourcefile: fileName,
      target: 'es2020',
    });

    await fs.writeFile(destinationPath, result.code, 'utf8');
  }

  const sourceStylesheet = await fs.readFile(path.join(filesDirectory, 'styles.css'), 'utf8');
  const optimizedStylesheet = await transform(sourceStylesheet, {
    loader: 'css',
    minify: true,
    sourcefile: 'styles.css',
    target: 'es2020',
  });

  await fs.writeFile(
    path.join(outputFilesDirectory, 'styles.css'),
    optimizedStylesheet.code,
    'utf8',
  );
}

async function build() {
  if (path.relative(projectDirectory, outputDirectory) !== 'dist') {
    throw new Error('The build output directory must be the project dist folder.');
  }

  await fs.rm(outputDirectory, { force: true, recursive: true });
  await fs.mkdir(outputDirectory, { recursive: true });
  await copyProjectFiles();
  await optimizeClientAssets();

  console.log('Built optimized wallpaper into dist/.');
}

build().catch(function (error) {
  console.error('Unable to build the wallpaper.', error);
  process.exitCode = 1;
});
