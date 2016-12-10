const gift = require('gift')

class Status {
  constructor() {

  }

  fetch(repo_config) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      let repo = gift(repo_config.config.path)
      repo.remote_fetch('origin', (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }

  getBranch(repo_config) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      let repo = gift(repo_config.config.path)
      repo.branch((err, branch) => {
        if (err) {
          return reject(err)
        }
        return resolve(branch)
      })
    })
  }

  getStatus(repo_config) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      let repo = gift(repo_config.config.path)
      let proms = []
      let obj = {}
      proms.push(this.getStatusAdv(repo))
      proms.push(this.getStatusPorcelain(repo))

      Promise.all(proms)
      .then((result) => {
        result.map((item) => {
          Object.assign(obj, item)
        })
        return resolve(obj)
      })
    })
  }

  getStatusAdv(repo) {
    return new Promise((resolve, reject) => {
      repo.statusAdv((err, status) => {
        if (err) {
          return reject(err)
        }
        return resolve({status: status.status})
      })
    })
  }

  getStatusPorcelain(repo) {
    return new Promise((resolve, reject) => {
      repo.status((err, status) => {
        if (err) {
          return reject(err)
        }
        return resolve({clean: status.clean})
      })
    })
  }
}

module.exports = new Status()