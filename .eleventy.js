module.exports = function(eleventyConfig) {
  // Static assets to pass through
  eleventyConfig.addPassthroughCopy("./src/img");
  eleventyConfig.addPassthroughCopy("./src/css");

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