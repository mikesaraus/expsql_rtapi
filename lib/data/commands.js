const { base64 } = require('../fn/fn.generator')

if (process.argv.includes('--command')) {
  // Special Command
  const command = process.argv.indexOf('--command')
  const _nextcmd = process.argv[command + 1]
  let cmd = _nextcmd && !_nextcmd.startsWith('--') ? _nextcmd : null

  if (cmd) {
    switch (true) {
      // Base 64 Encode
      case cmd.toLowerCase().startsWith('base64.encode=') && cmd.length > 14:
        console.log(base64.encode(cmd.slice(14) || ''))
        break

      // Base 64 Decode
      case cmd.toLowerCase().startsWith('base64.decode=') && cmd.length > 14:
        console.log(base64.decode(cmd.slice(14) || ''))
        break

      default:
        console.log('Unknown command!')
        break
    }
  }
  process.exit(0)
}
