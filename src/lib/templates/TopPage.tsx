import * as React from 'react';

export default class TopPage extends React.Component<{}, {}> {
  constructor(props: {}) {
    super(props);
  }

  render(): JSX.Element {
    return (
      <div>
        <h1>Hello, FOO!</h1>
      </div>
    );
  }
}
