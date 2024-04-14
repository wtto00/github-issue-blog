export default {
  '*': ['prettier --write --ignore-unknown'],
  'src/**/*.ts': [() => 'tsc --noEmit', 'eslint --cache --fix'],
}
