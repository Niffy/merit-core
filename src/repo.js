const gift = require('gift'),
Status = require('./status')

class Repo {
  constructor() {
    this.status = Status
  }

  remotes(repo_config) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      let repo = gift(repo_config.config.path)
      repo.remoteNames((err, remotes) => {
        if (err) {
          return reject(err)
        }
        return resolve(remotes)
      })
    })
  }

  addAll(repo_config) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      let repo = gift(repo_config.config.path)
      repo.status((err, status) => {
        if (err) {
          return reject(err)
        }
        let files = Object.keys(status.files)
        if (files.length > 0) {
          repo.add('.', (err) => {
            if (err) {
              return reject(err)
            }
            return resolve({added: true})
          })
        } else {
          return resolve({added: false})
        }
      })
    })
  }

  commit(repo_config, msg) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!msg) {
        return reject('No message provided')
      }
      let repo = gift(repo_config.config.path)
      this.status.getStatusPorcelain(repo)
      .then((status) => {
        if (status.clean === true) {
          return resolve ({commited: false, skipped: true})
        } else {
          repo.commit(msg, function (err) {
            if (err) {
              return reject(err)
            }
            return resolve({commited: true})
          })
        }
      })
    })
  }
  
  hasTag(repo_config, tag) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      
      if (!tag) {
        return reject('No tag provided')
      }
      let repo = gift(repo_config.config.path)
      repo.tags((err, tags) => {
        if (err) {
          return reject(err)
        }
        let res = tags.filter((item) => {
          if (item.name === tag) {
            return item
          }
        })
        if (res && res.length > 0) {
          return resolve(true)
        } else {
          return resolve(false)
        }
      })
    })
  }
  
  tag(repo_config, tag) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!tag) {
        return reject('No tag message provided')
      }
      let repo = gift(repo_config.config.path, tag)
      this.hasTag(repo_config, tag)
      .then((hasTag) => {
        if (hasTag === true) {
          return resolve({tagged: false, existsAlready: true})
        }
        repo.create_tag(tag, (err) => {
          if (err) {
            return reject({tagged: false, error: err})
          }
          return resolve({tagged: true})
        })
      })
      .catch(reject)
    })
  }
}

module.exports = new Repo()