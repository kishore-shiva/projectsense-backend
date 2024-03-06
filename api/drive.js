const ProjectSense = require('../src/drivers/npm/driver.js')
function setOptions(url) {
  const res = {}
  const options = {}
  const { hostname } = new URL(url)

  if (!hostname) {
    throw new Error('Invalid URL')
  }

  const headers = {}

  if (options.header) {
    ;(Array.isArray(options.header)
      ? options.header
      : [options.header]
    ).forEach((header) => {
      const [key, value] = header.split(':')

      headers[key.trim()] = (value || '').trim()
    })
  }

  const storage = {
    local: {},
    session: {},
  }

  for (const type of Object.keys(storage)) {
    if (options[`${type}Storage`]) {
      try {
        storage[type] = JSON.parse(options[`${type}Storage`])

        if (
          !options[`${type}Storage`] ||
          !Object.keys(options[`${type}Storage`]).length
        ) {
          throw new Error('Object has no properties')
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`${type}Storage error: ${error.message || error}`)
      }
    }
  }
  res.options = options
  res.headers = headers
  res.storage = storage
  return res
}

async function runProjectsense(url) {

    const { options, headers, storage } = setOptions(url)
    const projectsense = new ProjectSense(options)

    await projectsense.init()

    const site = await projectsense.open(url, headers, storage)

    await new Promise((resolve) =>
      setTimeout(resolve, parseInt(options.defer || 0, 10))
    )
    const results = await site.analyze()

    await projectsense.destroy()

    if(Object.keys(results).length === 0){
      throw new Error('Empty')
    }
    return results
}

module.exports = runProjectsense
