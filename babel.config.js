module.exports = function(api) {
  api.cache(true);
  const presets = [
    [
      '@babel/env',
      {
        modules: false
      }
    ]
  ];
  const plugins = [
    '@babel/syntax-dynamic-import',
    '@babel/proposal-object-rest-spread'
  ];

  return {
    presets,
    plugins
  };
};
