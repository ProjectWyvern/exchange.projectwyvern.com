export const clone = (obj) => JSON.parse(JSON.stringify(obj))

export const bind = function (name) {
  return function (n, o) {
    const query = clone(this.$route.query)
    if (n !== null) { query[name] = n } else { delete query[name] }
    this.$router.push({query: query})
  }
}
