const gift = require('gift')

class Branch {
  constructor() {

  }

  checkout(repo_config, branch, ops) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!branch) {
        return reject(new Error('No branch provided'))
      }
      if (!ops) {
        ops = {}
      }
      if (repo_config.branches.indexOf(branch) === -1) {
        if (ops.b === false) {
          return resolve({checkout: false, err: 'branch does not exist'})
        }
      }

      if (repo_config.branches.indexOf(branch) !== -1) {
        if (ops.b === true) {
          return resolve({checkout: false, err: 'branch already exixts'})
        }
      }

      let repo = gift(repo_config.config.path)
      repo.checkout(branch, ops, (err, branch) => {
        if (err) {
          return resolve({checkout: false, err: err})
        }
        return resolve({checkout: true})
      })
    })
  }

  create_branch(repo_config, branch, ops) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!branch) {
        return reject(new Error('No branch provided'))
      }

      if (repo_config.branches.indexOf(branch) !== -1) {
        return resolve({checkout: false, err: 'branch already exixts'})
      }

      let repo = gift(repo_config.config.path)
      repo.create_branch(branch, (err, branch) => {
        if (err) {
          return resolve({created: false, err: err})
        }
        return resolve({created: true})
      })
    })
  }

  remove(repo_config, branch) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!branch) {
        return reject(new Error('No branch provided'))
      }
      if (repo_config.branches.indexOf(branch) === -1) {
        return resolve({removed: false, err: 'branch does not exist'})
      }
      let repo = gift(repo_config.config.path)
      repo.delete_branch(branch, (err, branch) => {
        if (err) {
          return resolve({removed: false, err: err})
        }
        return resolve({removed: true})
      })
    })
  }

  push(repo_config, branch, ops) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!ops) {
        ops = {}
      }
      let defaultRemote = (repo_config.defaultRemote) ? repo_config.defaultRemote : 'origin'
      let remote = (ops.remote) ? ops.remote : defaultRemote

      if (repo_config.remotes.indexOf(remote) == -1) {
        return resolve({pushed: false, err: 'branch does not exist'})
      }
      let repo = gift(repo_config.config.path)
      repo.remote_push(remote, null, ops, (err) => {
        if (err) {
          console.log(err)
          return resolve({pushed: false, err: err})
        }
        return resolve({pushed: true})
      })
    })
  }

  branches(repo_config) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      let repo = gift(repo_config.config.path)
      repo.branches((err, branches) => {
        if (err) {
          return reject(err)
        }
        let names = branches.map((item) => {
          return item.name
        })
        return resolve(names)
      })
    })
  }

  getRemotes (repo_config) {
    return new Promise((resolve, reject) => {
      let repo = gift(repo_config.config.path)
      repo.remoteBranches({},(err, branches) => {
        if(err){
          return reject(err)
        }
        branches = branches.map((item) => {
          let t = item
          if (t.indexOf('->') !== -1) {
            t = t.substring(t.indexOf('->') + 3)
          }
          t.trim()
          t = t.split('/')
          return {
            remote: t[0],
            branch: t[1]
          }
        })
        return resolve(branches)
      })
    })
  }

  pull(repo_config, branch, ops) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!ops) {
        ops = {}
      }
      let defaultRemote = (repo_config.defaultRemote) ? repo_config.defaultRemote : 'origin'
      let remote = (ops.remote) ? ops.remote : defaultRemote
      this.getRemotes(repo_config)
      .then((branches) => {
        let found = branches.filter((item) => {
          if (item.remote === remote && item.branch === branch) {
            return true
          }
        })
        if (found.length == 1) {
          found = [0]
        } else {
           return resolve({pulled: false, err: 'Could not find branch on remote'})
        }
        let repo = gift(repo_config.config.path)
        repo.pull(remote, branch, (err) => {
          if (err) {
            console.log(err)
            return resolve({pulled: false, err: err})
          }
          return resolve({pulled: true})
        })
      })
      .catch((err) => {
        return resolve({pulled: false, err: err})
      })
    })
  }
}

module.exports = new Branch()