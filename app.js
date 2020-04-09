const async = require('async');
const epub = require('epub-gen');
const feed = require('feed-read');
const fs = require('fs');
const kindlegen = require('kindlegen');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '',
    pass: ''
  }
});

const mailOptions = {
  from: '',
  to: '',
  subject: 'convert',
  text: ' ',
  attachments: []
};

/*
let feedPrototype = {
title: 'Times of India',
url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
lapsedMinutes: 30
limit: 5,
cover: 'https://lawprofessors.typepad.com/.a/6a00d8341bfae553ef01b8d1594773970c-800wi',
}
*/

let feeds = [];

async.each(feeds, (_feed, cb) => {
  console.log(`Starting ${_feed.title}`);

  let options = {
    title: `${_feed.title} - ${new Date().toISOString().substring(0,10)} ${new Date().toISOString().substring(11,13)}h${new Date().toISOString().substring(14,16)}m`,
    author: 'Sahil Narain',
    publisher: 'Sahil Narain',
    content: []
  };

  _feed.cover ? options.cover = _feed.cover : null;

  async.waterfall([
    (doneCallback) => {
      feed(_feed.url, (err, rssFeed) => {
        if (err) {
          return doneCallback(err);
        }

        if (!rssFeed || !rssFeed.length) {
          return doneCallback('Error: Feed not found');
        }

        if (_feed.limit) {
          rssFeed = rssFeed.slice(0, _feed.limit);
        }

        console.log(`${_feed.title} - Fetched RSS content.`);
        return doneCallback(null, rssFeed);
      });
    },

    (rssFeed, doneCallback) => {
      rssFeed.map(rss => {
        rss.title = rss.title.replace(/<.*>/g, '');

        if (_feed.hasOwnProperty('lapsedMinutes')) {
          try {
            let publishedDate = new Date(rss.published).toISOString();

            if (new Date(rss.published) > new Date(new Date() - _feed.lapsedMinutes * 60 * 1000)) {
              let _content = {
                title: rss.title,
                data: rss.content
              };

              options.content.push(_content);
            }
          } catch (e) {
            let _content = {
              title: rss.title,
              data: rss.content
            };

            options.content.push(_content);
          }
        } else {
          let _content = {
            title: rss.title,
            data: rss.content
          };

          options.content.push(_content);
        }

        if (new Date(rss.published) > new Date(new Date() - _feed.lapsedMinutes * 60 * 1000)) {
          let _content = {
            title: rss.title,
            data: rss.content
          };

          options.content.push(_content);
        }
      });

      return doneCallback(null);
    },

    (doneCallback) => {
      let _fileName = __dirname + '/' + options.title;

      if (options.content.length) {
        new epub(options, `${_fileName}.epub`).promise.then(() => {
          console.log(`${_feed.title} - Generated epub.`)
          console.log(`${_feed.title} - Converting to mobi.`)
          kindlegen(fs.readFileSync(`${_fileName}.epub`), (error, mobi) => {
            fs.writeFileSync(`${_fileName}.mobi`, mobi);
            fs.unlinkSync(`${_fileName}.epub`);
            console.log(`${_feed.title} - Generated mobi.`)

            return doneCallback(null, _fileName);
          });
        }, (err) => {
          console.log(`${_feed.title} - Something went wrong.`);
          return doneCallback(null, _fileName);
        });
      } else {
        console.log(`${_feed.title} - Nothing to do.`);
        return doneCallback(null, null);
      }
    },

    (fileName, doneCallback) => {
      if (!fileName) {
        return doneCallback(null, false);
      }

      let _attachment = {
        filename: `${options.title}.mobi`,
        content: fs.readFileSync(fileName + '.mobi')
      };

      let _mailOptions = JSON.parse(JSON.stringify(mailOptions));
      _mailOptions.attachments.push(_attachment);

      console.log(`${_feed.title} - Sending email.`);
      transporter.sendMail(_mailOptions, (err, result) => {
        if (err) {
          return doneCallback(err);
        }

        console.log(`${_feed.title} - Email sent.`)
        return doneCallback(null, fileName);
      });
    },

    (fileName, doneCallback) => {
      if (!options.content.length) {
        return doneCallback(null, true);
      }

      console.log(`${_feed.title} - Cleaning up files.`);
      fs.unlinkSync(`${fileName}.mobi`);

      console.log(`${_feed.title} - Completed.`)
      return doneCallback(null, true);
    }
  ], (err, result) => {
    if (err) {
      console.log(`${_feed.title} - Error: ${err}`);
    }

    return cb(null);
  });
}, (err, result) => {
  if (err) {
    console.log(err);
    process.exit();
  }

  console.log('Done');
  process.exit();
});