import React, { Component } from 'react'
import BountiesContract from '../build/contracts/Bounties.json'
import getWeb3 from './utils/getWeb3'

import {Form, FormGroup, FormControl, Button, HelpBlock, Grid, Row, Panel} from 'react-bootstrap'
var ReactBsTable  = require('react-bootstrap-table');
var BootstrapTable = ReactBsTable.BootstrapTable;
var TableHeaderColumn = ReactBsTable.TableHeaderColumn;

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'
import './bootstrap.css';
import '../node_modules/react-bootstrap-table/dist/react-bootstrap-table-all.min.css';

const etherscanBaseUrl = "https://rinkeby.etherscan.io"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      bountiesInstance: undefined,
      bountyAmount: undefined,
      bountyData: undefined,
      bountyDeadline: undefined,
      etherscanLink: "https://rinkeby.etherscan.io",
      bounties: [],
      web3: null
    }

    this.handleIssueBounty = this.handleIssueBounty.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  async instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

     const contract = require('truffle-contract')
     const bounties = contract(BountiesContract)

     bounties.setProvider(this.state.web3.currentProvider)


     let instance = await bounties.deployed()
     this.setState({ bountiesInstance: instance })
     this.addEventListener(this)
  }

  addEventListener(component) {

    var bountyIssuedEvent = this.state.bountiesInstance.allEvents({fromBlock: 0, toBlock: 'latest'})

    bountyIssuedEvent.watch(async function(err, result) {
      if (err) {
        console.log(err)
        return
      }

      console.log(result)

      if(result.args)
      {
        if(result.event === "BountyIssued")
        {
          var newBountiesArray = component.state.bounties.slice()

          //First get the data from ipfs and add it to the result

          //let ipfsJson = await getJSON(result.args.data);
          //result.args['bountyData'] = ipfsJson.bountyData;
          //result.args['ipfsData'] = ipfsBaseUrl+"/"+result.args.data;
          newBountiesArray.push(result.args)
          component.setState({ bounties: newBountiesArray })
        }
      }

    })
  }

  // Handle form data change

  handleChange(event)
  {
    switch(event.target.name) {
        case "bountyData":
            this.setState({"bountyData": event.target.value})
            break;
        case "bountyDeadline":
            this.setState({"bountyDeadline": event.target.value})
            break;
        case "bountyAmount":
            this.setState({"bountyAmount": event.target.value})
            break;
        default:
            break;
    }
  }

  // Handle form submit

  async handleIssueBounty(event)
  {
    if (typeof this.state.bountiesInstance !== 'undefined') {
      event.preventDefault();
      //const ipfsHash = await setJSON({ bountyData: this.state.bountyData });
      let result = await this.state.bountiesInstance.issueBounty(this.state.bountyData,this.state.bountyDeadline,{from: this.state.web3.eth.accounts[0], value: this.state.web3.toWei(this.state.bountyAmount, 'ether')})
      this.setLastTransactionDetails(result)
    }
  }

  setLastTransactionDetails(result)
  {
    if(result.tx !== 'undefined')
    {
      this.setState({etherscanLink: etherscanBaseUrl+"/tx/"+result.tx})
    }
    else
    {
      this.setState({etherscanLink: etherscanBaseUrl})
    }
  }



  render() {
    return (
      <div className="App">
        <Grid>
        <Row>
        <a href={this.state.etherscanLink} target="_blank">Last Transaction Details</a>
        </Row>
        <Row>
        <Panel>
        <Panel.Heading>Issue Bounty</Panel.Heading>
        <Form onSubmit={this.handleIssueBounty}>
            <FormGroup
              controlId="fromCreateBounty"
            >
              <FormControl
                componentClass="textarea"
                name="bountyData"
                value={this.state.bountyData}
                placeholder="Enter bounty details"
                onChange={this.handleChange}
              />
              <HelpBlock>Enter bounty data</HelpBlock><br/>

              <FormControl
                type="text"
                name="bountyDeadline"
                value={this.state.bountyDeadline}
                placeholder="Enter bounty deadline"
                onChange={this.handleChange}
              />
              <HelpBlock>Enter bounty deadline in seconds since epoch</HelpBlock><br/>

              <FormControl
                type="text"
                name="bountyAmount"
                value={this.state.bountyAmount}
                placeholder="Enter bounty amount"
                onChange={this.handleChange}
              />
              <HelpBlock>Enter bounty amount</HelpBlock><br/>
              <Button type="submit">Issue Bounty</Button>
            </FormGroup>
        </Form>
        </Panel>
        </Row>

        <Row>
        <Panel>
        <Panel.Heading>Issued Bounties</Panel.Heading>
        <BootstrapTable data={this.state.bounties} striped hover>
          <TableHeaderColumn isKey dataField='bounty_id'>ID</TableHeaderColumn>
          <TableHeaderColumn dataField='issuer'>Issuer</TableHeaderColumn>
          <TableHeaderColumn dataField='amount'>Amount</TableHeaderColumn>
          <TableHeaderColumn dataField='data'>Bounty Data</TableHeaderColumn>
        </BootstrapTable>
        </Panel>
        </Row>
        </Grid>
      </div>
    );
  }
}

export default App
