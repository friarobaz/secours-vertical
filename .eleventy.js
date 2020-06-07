const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");

module.exports = function(eleventyConfig) {

  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addNunjucksFilter("test", function findNavigationEntries(nodes = [], key = "") {
    let pages = [];
    for(let entry of nodes) {
      if(entry.data && entry.data.eleventyNavigation) {
        let nav = entry.data.eleventyNavigation;
        if(!key && !nav.parent || nav.parent === key) {
          pages.push(Object.assign({}, nav, {
            url: nav.url || entry.data.page.url,
            pluginType: "eleventy-navigation",
            entry: entry,
          }, key ? { parentKey: key } : {}));
        }
      }
    }
  
    return pages.sort(function(a, b) {
      return (a.order || 0) - (b.order || 0);
    }).map(function(entry) {
      if(!entry.title) {
        entry.title = entry.key;
      }
      if(entry.key) {
        entry.children = findNavigationEntries(nodes, entry.key);
      }
      return entry;
    });
  });


  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  
  // Static assets to pass through
  eleventyConfig.addPassthroughCopy("./src/img");
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/flavicon.ico");

  return  {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    passthroughFileCopy: true,
    templateFormats : ["njk", "md"],
    htmlTemplateEngine : "njk",
    markdownTemplateEngine : "njk",
  };

};