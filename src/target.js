const fse = require('fs-extra'),
path = require('path'),
semver = require('semver')

class Target {
  constructor() {
  }
  
  readInPackage(path) {
    return new Promise((resolve, reject) => {
      fse.readJson(path, (err, data) => {
        if (err) {
          return reject(err)
        }
        return resolve(data)
      })
    })
  }
  
  writePackage(path, data) {
    return new Promise((resolve, reject) => {
      fse.writeJson(path, data, (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }
  
  findAliasInConfigs(configs, pkg) {
    return new Promise((resolve, reject) => {
      if (configs === undefined) {
        return reject(new Error('No configs provided'))
      }
      
      if (pkg === undefined) {
        return reject(new Error('No pkg provided'))
      }
      let found 
      configs.map((config) => {
        if (config.config) {
          let alias = []
          alias.push(config.config.name)
          if (config.config.alias) {
            alias = alias.concat(config.config.alias)
          }
          if (alias.indexOf(pkg) !== -1) {
            let uniq = new Set(alias)
            found = Array.from(uniq)
          }
        }
      })
      return resolve(found)
    })
  }
  
  hasPkg(contents, alias) {
    return new Promise((resolve, reject) => {
      if (contents === undefined) {
        return reject(new Error('No package data provided'))
      }

      if (contents.dependencies === undefined) {
        return reject(new Error(`Package ${contents.name} data does not contain dependencies`))
      }
      
      let keys = Object.keys(contents.dependencies)
      let found
      keys.map((item) => {
        if (alias.indexOf(item) !== -1) {
          found = { key: item, value: contents.dependencies[item]}
        } 
      })
      return resolve(found)
    })
  }
  
  isCorrectType (value, type) {
    if (type === 'branch') {
      if (value.indexOf('git+') !== -1) {
        return true
      } else {
        return false
      }
    }
    if (type === 'semver') {
      return semver.valid(value)
    }
    
    return false
  }
  
  changeDepBranch(from, to) {
    // Get location of the # in the url
    let loc = from.indexOf('#')
    if (loc > -1) {
      // Has branch so remove it
      from = from.substring(0, loc)
    }
    from = `${from}#${to}`
    return from
  }
  
  writeDep (pkgData, loc, value, type) {
    return new Promise((resolve, reject) => {
      if (pkgData === undefined) {
        return reject(new Error('No pacakge data provided'))
      }
      if(loc === undefined) {
        return reject(new Error('Current package dep info not provided'))
      } 
      if (value === undefined) {
        return reject(new Error('No new value provided'))
      }
      
      if (type === undefined) {
        return reject(new Error('No target type provided'))
      }
      let newValue, prevValue
      if (type === 'branch') {
        newValue = this.changeDepBranch(loc.value, value)
      }
      
      if (type === 'semver') {
        newValue = value
      }
      prevValue = pkgData.dependencies[loc.key]
      pkgData.dependencies[loc.key] = newValue 
      return resolve({pkgData, prevValue, newValue})
    })
  }
  
  setDep(repo_config, pkg, value, type, configs) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (pkg === undefined) {
        return reject(new Error('No package name provided'))
      }
      if (value === undefined) {
        return reject(new Error('No package value provided'))
      }
      if (type === undefined) {
        return reject(new Error('No target type provided'))
      }
      
      if (configs === undefined) {
        configs = []
      }
      
      let alias = [], packageData, packageKnownAs, prevValue, newValue
      
      let pkgFile = (repo_config.config.file || 'package.json')
      let pkgPath = path.join(repo_config.config.path, pkgFile)
      this.findAliasInConfigs(configs, pkg)
      .then((aliasFound) => alias = alias.concat(aliasFound))
      .then(() => this.readInPackage(pkgPath))
      .then((contents) => {
        packageData = contents
        return this.hasPkg(contents, alias)
      })
      .then((found) => {
        if (found === undefined) {
          return resolve({hasDep: false})
        }
        packageKnownAs = found
        return found
      })
      .then((found) => this.isCorrectType(found.value, type))
      .then((res) => {
        if (res === false) {
          return resolve({hasDep: true, incorrectType: true})
        }
        return
      })
      .then(() => this.writeDep(packageData, packageKnownAs, value, type))
      .then((latestPkgData) => {
        prevValue = latestPkgData.prevValue
        newValue = latestPkgData.newValue
        return this.writePackage(pkgPath, latestPkgData.pkgData)
      })
      .then(() => {
        return resolve({hasDep: true, written: true, previous: prevValue, now: newValue})
      })
      .catch(reject)
    })
  }
}

module.exports = new Target()