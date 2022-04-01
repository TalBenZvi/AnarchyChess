import { getFormLabelUtilityClasses } from '@mui/material';
import React, { Component } from 'react'
import { Button, Dimmer, Header, Icon } from 'semantic-ui-react'
  
const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = 
"https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css";
document.head.appendChild(styleLink);
  
export default class TestComponent extends Component {
  state = {dim: false}
  
  GetDIM = () => this.setState({ dim: true })
  HideDIM = () => this.setState({ dim: false })
  
  render() {
    const { dim } = this.state
  
    return (
      <div>
        <Dimmer.Dimmable dimmed={true}>
          <Header as='h3'>GeeksforGeeks </Header>
          Semantic UI
          
          <br />
          <Icon name='react' size='huge' />
          <Dimmer active={true} />
        </Dimmer.Dimmable>
  
        <Button onClick={this.GetDIM} content='Dim' />
        <Button onClick={this.HideDIM} content='Original' />
      </div>
    )
  }
}