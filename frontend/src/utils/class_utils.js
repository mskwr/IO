import React from 'react';
import {FormControl, InputGroup} from "react-bootstrap";
import {matchPath} from "react-router";

class Interval extends React.Component {
    emptyRange = {
        minValue: '',
        maxValue: ''
    }

    constructor(props) {
        super(props);
        this.state = {
            ...this.emptyRange,
            minValueName: 'min' + props.name,
            maxValueName: 'max' + props.name,
            minTitle: 'Min ' + props.name,
            maxTitle: 'Max ' + props.name
        }

        this.minValueChange = this.minValueChange.bind(this);
        this.maxValueChange = this.maxValueChange.bind(this);
    }

    updateParent(range) {
        this.props.updateParent(range, this.state.minValueName, this.state.maxValueName);
    }

    componentDidMount() {
        this.setState(prevState => ({
            ...prevState,
            ...this.emptyRange
        }));

        this.updateParent(this.emptyRange);
    }

    minValueChange(e) {
        let newState = this.state;
        newState = {
            ...newState,
            minValue: this.props.type ? e.target.value : Number(e.target.value),
        };

        this.setState({
            ...newState
        });

        this.updateParent(newState);
    }

    maxValueChange(e) {
        let newState = this.state;
        newState = {
            ...newState,
            maxValue: this.props.type ? e.target.value : Number(e.target.value)
        };

        this.setState({
            ...newState
        });

        this.updateParent(newState);
    }

    render() {
        return (
            <InputGroup className={"mb-3"}>
                <InputGroup.Text id={"basic-addon1"}>{this.state.minTitle}</InputGroup.Text>
                <FormControl
                    placeholder={this.state.minTitle}
                    type={this.props.type ? this.props.type : "number"}
                    min={this.props.min ? this.props.min : 0}
                    onChange={this.minValueChange}/>
                <InputGroup.Text id={"basic-addon1"}>{this.state.maxTitle}</InputGroup.Text>
                <FormControl
                    placeholder={this.state.maxTitle}
                    type={this.props.type ? this.props.type : "number"}
                    min={this.props.min ? this.props.min : 0}
                    onChange={this.maxValueChange}/>
            </InputGroup>
        )
    }
}

class SingleInput extends React.Component {
    emptyState = {
        value: ''
    }

    constructor(props) {
        super(props);
        this.state = {
            ...this.emptyState
        }

        this.valueChange = this.valueChange.bind(this);
    }

    componentDidMount() {
        this.setState({
            ...this.emptyState
        })

        this.props.updateParent(this.state, this.props.valueName);
    }

    valueChange(e) {
        let newState = this.state;
        newState.value = e.target.value;
        this.setState({
            ...newState
        });

        this.props.updateParent(newState, this.props.valueName);
    }

    render() {
        return (
            <InputGroup className={"mb-3"}>
                <InputGroup.Text id={"basic-addon1"}>{this.props.valueTitle}</InputGroup.Text>
                <FormControl
                    placeholder={this.props.valueTitle}
                    type={this.props.type ? this.props.type : "text"}
                    value={this.state.value}
                    onChange={this.valueChange}
                    required={!!this.props.required}
                    />
            </InputGroup>
        )
    }
}

function updateFromInterval(object, interval, minValueName, maxValueName) {
    object[minValueName] = interval.minValue;
    object[maxValueName] = interval.maxValue;
    return object;
}

function updateFromSingleInput(object, singleInput, valueName) {
    object[valueName] = singleInput.value;
    return object;
}

function checkPathId(path, pattern) {
    const match = matchPath({
        path: pattern
    }, path);
    if (match === null || !Number.isInteger(Number(match.params.id)) || Number(match.params.id) < 0) {
        return {id: -1, isCorrect: false};
    } else {
        return {id: Number(match.params.id), isCorrect: true};
    }
}

export {Interval, SingleInput, updateFromSingleInput, updateFromInterval, checkPathId};