import 'babel-polyfill';
import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'path';
import url from 'url';

import packageInfo from '../package.json';

import adb from './adb';
import server from './server';
import './ipc';
import { listen } from './ipc/listen';
import { getUsablePort } from './utils';

let win;

app.on('ready', () => {
  win = new BrowserWindow({
    title: 'ADB UI',
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#FAFAFA',
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegrationInWorker: true
    }
  });
  win.once('ready-to-show', () => win.show());

  // electron config
  const menu = Menu.buildFromTemplate([
    // {
    //   label: '功能',
    //   submenu: [
    //     {
    //       label: '查找',
    //       accelerator: 'CmdOrCtrl+F',
    //       click: () => win.webContents.send('find')
    //     }
    //   ]
    // },
    {
      label: '帮助',
      submenu: [
        {
          label: '问题反馈',
          click: () => shell.openExternal('https://github.com/LzxHahaha/ADB-UI/issues')
        },
        {
          label: '当前版本：' + packageInfo.version
        }
      ]
    }
  ]);
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000/');
    win.webContents.openDevTools();
    Menu.setApplicationMenu(menu);
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, './resources/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }
  win.on('closed', () => win = null);

  // start adb server
  adb.startServer();
  // start koa server
  // TODO: cluster
  getUsablePort().then(port => server.listen(port, (err) => {
    if (err) {
      console.error(err);
    }
    console.log(`listening on port: ${port}`);
  }));

  listen('quit', () => app.quit());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});
