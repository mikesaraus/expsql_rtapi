/**
 *
 * @typedef {Object} InternetCheckerConfig     Settings to check
 * @property {Number} timeout             Execution time in milliseconds
 * @property {Number} retries             Total query attempts made during timeout
 * @property {String} domainName          Domain to check for connection by default google.com
 * @property {Number} port                Port where the DNS lookup should check by default 53
 * @property {String} host                DNS Host where lookup should check by default '8.8.8.8' (Google Public DNS)
 */

/**
 * Internet available is a very simple method that allows you to check if there's an active
 * internet connection by resolving a DNS address and it's developer friendly.
 *
 * @param {InternetCheckerConfig} config
 * @return {Promise<void>}
 */
function isOnline(config) {
  const dns = require('dns-socket')

  return new Promise(function (resolve, reject) {
    // Create instance of the DNS resolver
    const socket = dns({
      timeout: config.timeout || 5000,
      retries: config.retries || 5,
    })

    // Run the dns lowlevel lookup
    socket.query(
      {
        questions: [
          {
            type: 'A',
            name: config.domainName || 'google.com',
          },
        ],
      },
      config.port || 53,
      config.host || '8.8.8.8'
    )

    // DNS Address solved, internet available
    socket.on('response', () => {
      socket.destroy(() => {
        resolve()
      })
    })

    // Verify for timeout of the request (cannot reach server)
    socket.on('timeout', () => {
      socket.destroy(() => {
        reject()
      })
    })
  })
}

module.exports = isOnline
