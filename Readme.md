# mini driver backend
<p>
  A simple driver made out of fun.</br>
  This is backend repository, see mini-driver-frontend for frontend.
</p>
<p>
- nodejs v18.19.0</br>
- express + express ws</br>
- typescript + eslint</br>
- jest
</p>

## About the server
<ul>
  <li>It listens port 3000</li>
  <li>to start the production server, execute run.bat or run the 'Start production server' command in the project root</li>
  <li>It creates folder 'asset', 'temp' and 'log' in the root if these folders do not exist</li>
  <ul>
    <li>Asset folder: store the file and folder in the driver</li>
    <li>Temp folder: store the files that are uploading from other devices</li>
    <li>Log folder: store server log files</li>
  </ul>
</ul>

## About the release
<i>Ensure correct version of nodejs is installed</i>

### File in release
<ul>
  <li>backend_dist: the built code of this repository</li>
  <li>frontend_dist: the built code of mini-driver-frontend repository</li>
  <li>package.json</li>
  <li>install.bat: execute npm install</li>
  <li>run.bat: execute npm run start:prod, start the server</li>
  <li><i>Dockerfile: For create a docker image of this driver. (But the driver is not work well in docker container now)</i></li>
</ul>

## Commands
### Install package
```
npm install
```

### Start development live reload server (nodemon)
```
npm run start:dev
```

### Run unit test
```
npm test
```

### Run the test of single test.ts file
for example, run /tests/app.test.ts
```
npm run test:one --file_nm=app.test.ts
```

### Build to project to backend_dist
```
npm run build
```

### Start production server
<i>Make sure that frontend_dist folder is in the project root</i>
```
npm run start:prod
```
