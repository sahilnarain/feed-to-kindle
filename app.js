var async = require('async');
var request = require('request');
var feed = require('feed-read');
var epub = require('epub-gen');
var args = require('yargs').argv;

if (!args.url) {
  console.log('Usage: --url <feedUrl> [optional] --cutoff <yyyy-mm-dd> --file <filename>');
  process.exit(1);
}

var url = args.url;

if (args.cutoff) {
  var cutoff = new Date(args.cutoff);
}

if (args.file) {
  var file = args.file;
} else {
  var file = 'content';
}

var links = [],
  content = [];

async.waterfall([
  function (doneCallback) {
    feed(url, function (err, result) {

      if (err) {
        return doneCallback(err);
      }

      return doneCallback(null, result);
    });
  },

  function (rss, doneCallback) {
    for (i = 0; i < rss.length; i++) {
      if (args.cutoff) {
        if (rss[i].published > cutoff) {
          links.push(rss[i].link);
        }
      } else {
        links.push(rss[i].link);
      }
    }
    return doneCallback(null, links);
  },

  function (links, doneCallback) {
    if (links.length === 0) {
      console.log('No content');
    }

    async.eachSeries(links, function (link, cb) {
      setTimeout(function () {
        var options = {
          method: 'GET',
          url: process.env.PARSER_ARTICLE + '?api_key=' + process.env.PARSER_KEY + '&url=' + links
        };

        request(options, function (err, response, body) {
          if (err) {
            return cb(err);
          }

          body = JSON.parse(body);
          content.push(body);
          return cb(null);
        });
      }, 1000);
    }, function (err) {
      if (err) {
        return doneCallback(err);
      }

      return doneCallback(null, content);
    });
  },

  function (content, doneCallback) {
    var bookData = {
      title: file,
      author: content[0].author,
      publisher: 'Sahil Narain',
      content: []
    };

    content.forEach(function (con) {
      var chapter = {
        title: con.title,
        author: con.author,
        data: con.html
      };

      bookData.content.push(chapter);
    });

    return doneCallback(null, bookData);
  },

  function (bookData, doneCallback) {
    new epub(bookData, __dirname + '/' + file + '.epub');
    return doneCallback(null);
  }
], function (err) {
  if (err) {
    console.log('Error');
    process.exit(0);
  }

  console.log('Done');
});