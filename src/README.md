# projectsense core

[projectsense](https://www.projectsense.com/) identifies technologies on websites.

## Installation

```shell
$ npm i projectsense-core
```

## Usage

```javascript
#!/usr/bin/env node

const fs = require('fs')
const projectsense = require('./projectsense')

// See https://github.com/projectsense/projectsense/blob/master/README.md#specification
const categories = JSON.parse(
  fs.readFileSync(path.resolve(`./categories.json`))
)

let technologies = {}

for (const index of Array(27).keys()) {
  const character = index ? String.fromCharCode(index + 96) : '_'

  technologies = {
    ...technologies,
    ...JSON.parse(
      fs.readFileSync(path.resolve(`./technologies/${character}.json`))
    ),
  }
}

projectsense.setTechnologies(technologies)
projectsense.setCategories(categories)

projectsense.analyze({
  url: 'https://example.github.io/',
  meta: { generator: ['WordPress'] },
  headers: { server: ['Nginx'] },
  scriptSrc: ['jquery-3.0.0.js'],
  cookies: { awselb: [''] },
  html: '<div ng-app="">',
}).then((detections) => {
  const results = projectsense.resolve(detections)

  console.log(results)
})
```
