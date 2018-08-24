const gift = require('gift')

class Push {
  constructor() {

  }

  pushBranch(repo_config, branch, ops) {
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
      repo.remote_push(remote, null, ops, (err, output) => {
        if (err) {
          return resolve({pushed: false, err: err})
        }
        return resolve({pushed: true})
      })
    })
  }

  pushUpstream(repo_config, ops) {
    return new Promise((resolve, reject) => {
      if (!repo_config) {
        return reject(new Error('No config provided'))
      }
      if (!ops) {
        ops = {}
      }

      if (!ops.remote) {
        return reject(new Error('No remote provided'))
      }

      if (!ops.branch) {
        return reject(new Error('No branch provided'))
      }

      let repo = gift(repo_config.config.path)
      repo.pushUpstream(ops, (err, result) => {
        if (err) {
          return resolve({pushed: false, err: err})
        }
        return resolve({pushed: true, message: result})
      })
    })
  }

}

module.exports = new Push()