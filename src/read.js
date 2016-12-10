"use strict"
const fs = require('fs'),
  fse = require('fs-extra'),
  Branch = require('./branch'),
  Repo = require('./repo')

class Read {

  constructor() {

  }

  read (filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, content) => {
        if (err) {
          return reject(err)
        }
        return resolve(content)
      })
    })
  }

  validateConfig (config) {
    return new Promise((resolve, reject) => {
      resolve(true)
    })
  }

  loadConfigFromFile(path) {
    return new Promise((resolve, reject) => {
      if (!path) {
        return reject(new Error('No path provided to load config from file'))
      }
      fse.readJson(path, (err, file) => {
        if (err) {
          return reject(err)
        }
        return resolve(file)
      })
    })
  }

  loadInMemory(config) {
    return new Promise((resolve, reject) => {
      if (!config) {
        return reject(new Error('No config provided'))
      }
      let deps = []
      let self = this
      let iter = config[Symbol.iterator]()
      function next() {
        let item = iter.next()
        if (item.done) {
          return resolve(deps)
        }

        let t = {}
        Object.assign(t, item.value)
        if (item.value.config.path) {
          self.fetchPackage(t)
          .then((result) => {
            t.package = result
          })
          .then(()=> Branch.branches(t) )
          .then((branches)=> {
            t.branches = branches
          })
          .then(()=> Repo.remotes(t) )
          .then((remotes)=> {
            t.remotes = remotes
            deps.push(t)
            return next()
          })
          .catch((err) => {
            console.error(`Failed to load ${item.value.name}`, err)
            failed.push({
              name: item.value.name
            })
            return next()
          })
        } else {
          console.error(`No path provided for ${item.value.name}`)
          return next()
        }
      }
      next()
    })
  }

  loadConfig (config) {
    return new Promise((resolve, reject) => {
      let self = this;
      if (Array.isArray(config) === false) {
        return reject(new Error('Config is not an array of items'))
      }
      let iter = config[Symbol.iterator]()
      let deps = []
      let failed = []
      function next() {
        let item = iter.next()
        if (item.done) {
          return resolve({ deps, failed })
        }

        let t = {
          name: item.value.name,
          config: item.value
        }
        deps.push(t)
        return next()
      }
      next()
    })
  }

  fetchPackage(repo) {
    let path = repo.config.path
    let file = repo.config.file
    return new Promise((resolve, reject) => {
      let ex = file || 'package.json'
      if (path[path.length -1] !== '/') {
        path += '/'
      }
      path += ex
      this.read(path)
      .then((result) => {
        return resolve(JSON.parse(result))
      })
      .catch(reject)
    })
  }

}

module.exports = Read