FROM nginx:alpine

RUN apk add yarn

# install packages
WORKDIR /usr/src/app
COPY ./package.json /usr/src/app/package.json
COPY ./yarn.lock /usr/src/app/yarn.lock
RUN yarn install --production

# SET working directory & copy app files to it
COPY . /usr/src/app

# build app
RUN yarn build

# Copy build files & nginx config to nginx directory
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf
RUN cp -a /usr/src/app/build/. /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
