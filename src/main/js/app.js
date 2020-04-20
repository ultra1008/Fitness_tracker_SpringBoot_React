const React = require('react');
const ReactDOM = require('react-dom');
import { Navbar } from "react-bulma-components";
import Moment from 'moment';
import {
	BrowserRouter as Router,
	Switch,
	Route,
	NavLink,
	Redirect
} from "react-router-dom";

import FitnessWeekTable from './FitnessWeekTable';
import FitnessWeekGraphFilter from './FitnessWeekGraphFilter';
import FitnessWeekForm from "./FitnessWeekForm";
import FitnessWeekDateFilter from "./FitnessWeekDateFilter";
import FitnessWeekSumReport from "./FitnessWeekSumReport";
import ErrorHandlerRedirect from "./ErrorHandlerRedirect";
import ErrorPage from "./ErrorPage";


class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			loading: true, fitnessWeeks: [], "graphAttrs": [
				{
					"id": 0,
					"title": "Total Miles",
					"attr": "totalMiles"
				},
				{
					"id": 1,
					"title": "Total Calories",
					"attr": "totalCalories"
				},
				{
					"id": 2,
					"title": "Total Time",
					"attr": "totalTime"
				}
			],
			"sumForWeeks": {},
			"fitnessWeekSums": [],
			"weekEditIndex": -1
		};

		this.addWeek = this.addWeek.bind(this);
		this.editWeek = this.editWeek.bind(this);
		this.sortWeeks = this.sortWeeks.bind(this);
		this.handleFilterDates = this.handleFilterDates.bind(this);
		this.getDateFilterDetails = this.getDateFilterDetails.bind(this);
		this.getSumDataForDates = this.getSumDataForDates.bind(this);
		this.getSumsByMonths = this.getSumsByMonths.bind(this);
		this.getAllFitnessData = this.getAllFitnessData.bind(this);
		this.clearErrorMessageState = this.clearErrorMessageState.bind(this);
		this.handleError = this.handleError.bind(this);
		this.handleClickDelete = this.handleClickDelete.bind(this);
		this.findWeekIndexById = this.findWeekIndexById.bind(this);
		this.handleClickEdit = this.handleClickEdit.bind(this);
	}

	componentDidMount() {
		this.setState({ "loading": true });
		this.getAllFitnessData();
	}

	componentDidCatch(error, info) {
		this.handleError(error);
	}

	render() {
		const dateFilter = this.getDateFilterDetails();
		const defaultDatesForSum = this.getDefaultDatesForSum();
		const weekFromEditIndex = (this.state.weekEditIndex >= 0 ? this.state.fitnessWeeks[this.state.weekEditIndex] : {});
		return (
			<Router>
				<Navbar color="info">
					<Navbar.Brand>
						<Navbar.Item renderAs="span"><i className="fas fa-running"></i> Fitness Tracker</Navbar.Item>
						<Navbar.Burger data-target="navLinksMenu" />
					</Navbar.Brand>
					<Navbar.Menu className="is-active">
						<Navbar.Container>
							<NavLink exact activeClassName="is-active" onClick={this.clearErrorMessageState} className="is-tab navbar-item" to="/index" >Home</NavLink>
							<NavLink exact activeClassName="is-active" onClick={this.clearErrorMessageState} className="is-tab navbar-item" to="/graph" >Daily Graph</NavLink>
							<NavLink exact activeClassName="is-active" onClick={this.clearErrorMessageState} className="is-tab navbar-item" to="/sums">Monthly Graph</NavLink>
							<NavLink exact activeClassName="is-active" onClick={this.clearErrorMessageState} className="is-tab navbar-item" to="/sumsAnnual" >Annual Report</NavLink>
							<NavLink exact activeClassName="is-active" onClick={this.clearErrorMessageState} className="is-tab navbar-item" to="/create" >Add Week</NavLink>
						</Navbar.Container>
					</Navbar.Menu>
				</Navbar>
				<Switch>
					<Route path="/graph">
						<ErrorHandlerRedirect error={this.state.error} >
							<FitnessWeekGraphFilter error={this.state.error} showByX="dateRecorded" showAttrs={this.state.graphAttrs} weeks={this.state.fitnessWeeks}>
								<FitnessWeekDateFilter {...dateFilter} onFilterDates={this.handleFilterDates} />
							</FitnessWeekGraphFilter>
						</ErrorHandlerRedirect>
					</Route>
					<Route path="/create">
						<ErrorHandlerRedirect error={this.state.error} >
							<FitnessWeekForm handleError={this.handleError} title="Add Week" addWeek={this.addWeek} editWeek={this.editWeek} week={weekFromEditIndex} />
						</ErrorHandlerRedirect>
					</Route>
					<Route path="/sumsAnnual">
						<ErrorHandlerRedirect error={this.state.error} >
							<FitnessWeekSumReport error={this.state.error} title="Annual Report" sumData={this.state.sumForWeeks}>
								<FitnessWeekDateFilter {...defaultDatesForSum} onFilterDates={this.getSumDataForDates} />
							</FitnessWeekSumReport>
						</ErrorHandlerRedirect>
					</Route>
					<Route path="/sums">
						<ErrorHandlerRedirect error={this.state.error} >
							<FitnessWeekGraphFilter error={this.state.error} showByX="endDate" showAttrs={this.state.graphAttrs} weeks={this.state.fitnessWeekSums}>
								<FitnessWeekDateFilter {...defaultDatesForSum} onFilterDates={this.getSumsByMonths} />
							</FitnessWeekGraphFilter>
						</ErrorHandlerRedirect>
					</Route>
					<Route path="/error">
						<ErrorPage error={this.state.error} />
					</Route>
					<Route path="/500">
						<ErrorPage error="An unexpected error has occurred." />
					</Route>
					<Route path="/404">
						<ErrorPage error="Page not found." />
					</Route>
					<Route path="/index">
						<ErrorHandlerRedirect error={this.state.error} >
							<FitnessWeekTable title="All Weeks" weeks={this.state.fitnessWeeks} handleClickDelete={this.handleClickDelete} handleClickEdit={this.handleClickEdit} />
						</ErrorHandlerRedirect>
					</Route>
					<Redirect to="/404" />
				</Switch>
			</Router>
		);
	}

	addWeek(createdWeek) {
		this.state.fitnessWeeks.push(createdWeek);
		this.sortWeeks();
		this.setState({ "loading": false });
	}

	editWeek(updatedWeek) {
		const index = this.findWeekIndexById(updatedWeek.id);
		if (index == -1) {
			this.setState({ "error": "Could not find week to edit with id: " + updatedWeek.id });
		}
		else {
			this.state.fitnessWeeks[index] = updatedWeek;
			this.sortWeeks();
			this.setState({ "loading": false });
		}
	}

	sortWeeks() {
		this.state.fitnessWeeks.sort(this.compareWeeks);
	}

	compareWeeks(a, b) {
		if (a.dateRecorded > b.dateRecorded) return 1;
		if (b.dateRecorded > a.dateRecorded) return -1;

		return 0;
	}

	getDefaultDatesForSum() {
		const JANUARY = 0;//months start at 0
		const startOfYear = Moment(new Date(new Date().getFullYear(), JANUARY, 1)).format('YYYY-MM-DD');
		const today = Moment(new Date()).format('YYYY-MM-DD');
		return {
			"startDate": startOfYear,
			"endDate": today
		};
	}

	getDateFilterDetails() {
		//this grabs the first and last fitness weeks to use as the default start and end dates
		if (this.state.fitnessWeeks && this.state.fitnessWeeks.length > 0) {
			const firstIndex = 0;
			const lastIndex = this.state.fitnessWeeks.length - 1;
			const startDate = this.state.fitnessWeeks[firstIndex].dateRecorded;
			const endDate = this.state.fitnessWeeks[lastIndex].dateRecorded;
			return {
				"startDate": startDate,
				"endDate": endDate
			};
		}
		else {
			return {};
		}
	}

	clearErrorMessageState() {
		this.setState({ "error": null, "weekEditIndex": -1 });
	}

	getAllFitnessData() {
		const defaultDates = this.getDefaultDatesForSum();
		fetch('./rest/fitnessWeeks')
			.then(res => {
				if (!res.ok) {
					if (res.status == 404) {
						throw Error("Problem getting data, fitness data not found.")
					}
					else {
						throw Error("An unexpected problem occurred, response code: " + res.status);
					}

				}
				else {
					res.json().then((data) => {
						this.setState({ fitnessWeeks: data });
						this.sortWeeks();
						this.getSumDataForDates(defaultDates.startDate, defaultDates.endDate);
						this.getSumsByMonths(defaultDates.startDate, defaultDates.endDate);
					});
				}
			})
			.catch((error) => {
				this.handleError(error);
			});
	}

	getSumDataForDates(startDate, endDate) {
		this.setState({ "loading": true });
		const url = './rest/fitnessWeeks/sum/between?startDate=' + startDate + '&endDate=' + endDate;
		fetch(url, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			redirect: 'error',
			referrerPolicy: 'no-referrer'
		})
			.then(res => {
				if (!res.ok) {
					if (res.status == 404) {
						throw Error("Problem getting data, sum data not found for dates selected.")
					}
					else {
						throw Error("An unexpected problem occurred, response code: " + res.status);
					}

				}
				else {
					res.json().then((data) => {
						this.setState({ sumForWeeks: data, "loading": false });
					});
				}
			})
			.catch((error) => {
				this.handleError(error);
			});
	}

	findWeekIndexById(id) {
		var indexFound = -1;
		//first check to see if the id given is even in the list of weeks
		for (var i = 0; i < this.state.fitnessWeeks.length; i++) {
			if (this.state.fitnessWeeks[i].id == id) {
				indexFound = i;
				break;
			}
		}

		return indexFound;
	}

	handleClickDelete(id) {
		this.setState({ "loading": true });
		const url = '/rest/fitnessWeek/' + id;
		const indexOfDeleted = this.findWeekIndexById(id);

		//if the id given is not found then go to error page
		if (indexOfDeleted == -1) {
			this.setState({ "error": "Could not find week to be deleted with key: " + id });
			return;
		}

		//send a delete request for the id provided
		fetch(url, {
			method: 'DELETE',
			mode: 'cors',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			redirect: 'error',
			referrerPolicy: 'no-referrer'
		})
			.then(res => {
				if (!res.ok) {
					if (res.status == 404) {
						throw Error("Problem deleting data, fitness data not found for id selected.")
					}
					else {
						throw Error("An unexpected problem occurred, response code: " + res.status);
					}

				}
				else {
					//if delete returns 200 we do not care about the response data
					//delete the week from the list by copying and splicing
					const allWeeks = [...this.state.fitnessWeeks];
					allWeeks.splice(indexOfDeleted, 1);
					this.setState({ loading: false, fitnessWeeks: allWeeks });
				}
			})
			.catch((error) => {
				this.handleError(error);
			});
	}

	handleFilterDates(startDate, endDate) {
		this.setState({ "loading": true });
		const url = './rest/fitnessWeeks/between?startDate=' + startDate + '&endDate=' + endDate;
		fetch(url, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			redirect: 'error',
			referrerPolicy: 'no-referrer'
		})
			.then(res => {
				if (!res.ok) {
					if (res.status == 404) {
						throw Error("Problem getting data, fitness data not found for dates selected.")
					}
					else {
						throw Error("An unexpected problem occurred, response code: " + res.status);
					}

				}
				else {
					res.json().then((data) => {
						this.setState({ fitnessWeeks: data });
						this.sortWeeks();
						this.setState({ "loading": false });
					});
				}
			})
			.catch((error) => {
				this.handleError(error);
			});
	}

	getSumsByMonths(startDate, endDate) {
		this.setState({ "loading": true });
		const url = './rest/fitnessWeeks/sums?startDate=' + startDate + '&endDate=' + endDate;
		fetch(url, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			redirect: 'error',
			referrerPolicy: 'no-referrer'
		})
			.then(res => {
				if (!res.ok) {
					if (res.status == 404) {
						throw Error("Problem getting data, sum data not found.")
					}
					else {
						throw Error("An unexpected problem occurred, response code: " + res.status);
					}

				}
				else {
					res.json().then((data) => {
						this.setState({ fitnessWeekSums: data, "loading": false });
					});
				}
			})
			.catch((error) => {
				this.handleError(error);
			});
	}

	handleClickEdit(id) {
		const indexOfWeek = this.findWeekIndexById(id);
		if (indexOfWeek == -1) {
			this.setState({ "error": "Could not find week to be edited with key: " + id });
			return;
		}
		else {
			this.setState({ "weekEditIndex": indexOfWeek });
		}
	}

	handleError(error) {
		console.log(error);
		this.setState({ "error": error.message });
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('react')
)