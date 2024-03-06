FROM node:14-alpine

MAINTAINER projectsense <hello@projectsense.com>

ENV projectsense_ROOT /opt/projectsense
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_BIN /usr/bin/chromium-browser

RUN apk update && apk add -u --no-cache \
	nodejs \
  udev \
  chromium \
  ttf-freefont \
  yarn

RUN mkdir -p "$projectsense_ROOT/browsers"

WORKDIR "$projectsense_ROOT"

COPY technologies ./technologies
COPY \
  cli.js \
  categories.json \
  driver.js \
  package.json \
  projectsense.js \
  yarn.lock ./

RUN yarn install

ENTRYPOINT ["node", "cli.js"]
