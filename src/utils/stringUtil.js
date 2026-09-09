const random = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 40; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export const stringUtil = { random }
