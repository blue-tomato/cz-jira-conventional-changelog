const chalk = require('chalk');
const branch = require('git-branch');
const types = require('./types');

const getLongInput = ({ required = false, maxLength = 80 }) => ({
  validate: value => {
    const length = value.trim().length;

    return required && length <= 0
      ? 'required'
      : length > maxLength
      ? 'max ' + maxLength + ' chars'
      : true;
  },
  transformer: value => '(' + value.trim().length + ') ' + value,
  filter: value => value.trim()
});

const longest = array =>
  array.reduce(
    (acc, current) => (current.length > acc ? current.length : acc),
    0
  );

const keys = Object.keys(types);
const choices = keys.map(key => ({
  name:
    (types[key].title + ':').padEnd(
      longest(keys.map(key => types[key].title)) + 2
    ) + types[key].description,
  value: types[key].title
}));

const formatCommit = ({ issue, type, scope, subject }) =>
  `${issue ? issue : '(NOTASK)'} ${type}${
    scope.length >= 1 ? `(${scope})` : ''
  }: ${subject}`;

module.exports = {
  prompter: (cz, commit, ...args) => {
    const match = branch.sync().match(/[A-Z]+-[0-9]+/);
    const issueId = match && match[0];

    cz.prompt([
      {
        type: 'confirm',
        name: 'isIssueAffected',
        message: 'Does this change affect an issue?',
        default: true
      },
      {
        ...getLongInput({
          required: true,
          maxLength: 20
        }),
        type: 'input',
        name: 'issue',
        message: 'Issue reference:',
        when: answers => answers.isIssueAffected,
        default: issueId,
        transformer: value =>
          '(' + value.trim().length + ') ' + value.toUpperCase(),
        filter: value => value.trim().toUpperCase()
      },
      {
        type: 'list',
        name: 'type',
        message: "Select the type of change that you're committing:",
        choices,
        default: choices[0]
      },
      {
        ...getLongInput({
          required: false,
          maxLength: 20
        }),
        type: 'input',
        name: 'scope',
        message: 'What is the scope of this change: (press enter to skip)',
        default: undefined,
        transformer: value =>
          '(' + value.trim().length + ') ' + value.toLowerCase(),
        filter: value => value.trim().toLowerCase()
      },
      {
        ...getLongInput({
          required: true,
          maxLength: 60
        }),
        type: 'input',
        name: 'subject',
        message: 'Write a short, imperative tense description of the change:\n',
        default: undefined
      },
      {
        type: 'confirm',
        name: 'commit',
        message: answers =>
          ` Commit with this message? ${chalk.cyan(formatCommit(answers))}`,
        default: true
      }
    ]).then(answers => {
      if (answers.commit) {
        commit(formatCommit(answers));
      } else {
        console.log(chalk.red('Aborted ...'));
      }
    });
  }
};
