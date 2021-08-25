// @flow

import type { ElementRef } from 'react';

import { createRef, Component } from 'react';
import Button from 'app/components/Button';
import styles from './Poll.css';
import type { PollEntity, OptionEntity } from 'app/reducers/polls';
import { sortBy } from 'lodash';
import { Link } from 'react-router-dom';
import Icon from 'app/components/Icon';
import { Flex } from 'app/components/Layout';
import Tooltip from 'app/components/Tooltip';
import cx from 'classnames';

type Props = {
  poll: PollEntity,
  handleVote: (pollId: number, optionId: number) => Promise<*>,
  backgroundLight?: boolean,
  details?: boolean,
};

type OptionEntityRatio = OptionEntity & {
  ratio: number,
};

type State = {
  shuffledOptions: Array<OptionEntityRatio>,
  expanded: boolean,
};

class Poll extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const options = this.optionsWithPerfectRatios(props.poll.options);
    const shuffledOptions = this.shuffle(options);
    this.state = {
      shuffledOptions: shuffledOptions,
      expanded: false,
    };
  }
  optionsRef = createRef<ElementRef<Flex>>();

  toggleTruncate = () => {
    this.setState({
      expanded: !this.state.expanded,
    });
  };

  optionsWithPerfectRatios = (options: Array<OptionEntity>) => {
    const totalVotes = options.reduce((a, option) => a + option.votes, 0);
    const ratios = options.map((option) => {
      return { ...option, ratio: (option.votes / totalVotes) * 100 };
    });
    return this.perfectRatios(ratios);
  };

  // As described in: https://stackoverflow.com/questions/13483430/how-to-make-rounded-percentages-add-up-to-100
  perfectRatios = (
    options: $ReadOnlyArray<OptionEntityRatio>
  ): OptionEntityRatio[] => {
    const off =
      100 - options.reduce((a, option) => a + Math.floor(option.ratio), 0);
    return sortBy<OptionEntityRatio>(
      options,
      (o: OptionEntityRatio) => Math.floor(o.ratio) - o.ratio
    )
      .map((option: OptionEntityRatio, index: number) => {
        return {
          ...option,
          ratio: Math.floor(option.ratio) + (index < off ? 1 : 0),
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  };

  shuffle = (array: Array<OptionEntityRatio>) => {
    const oldArray = array.slice(0);
    const newArray = [];
    for (let i = 0; i < array.length; i++) {
      const randIndex = Math.floor(Math.random() * oldArray.length);
      newArray[i] = oldArray[randIndex];
      oldArray.splice(randIndex, 1);
    }

    return newArray;
  };

  render() {
    const { poll, handleVote, backgroundLight, details } = this.props;
    const { expanded, shuffledOptions } = this.state;
    const {
      id,
      title,
      description,
      hasAnswered,
      totalVotes,
      resultsHidden,
    } = poll;
    const options = this.optionsWithPerfectRatios(this.props.poll.options);
    const orderedOptions = hasAnswered ? options : shuffledOptions;
    const optionsToShow = expanded ? orderedOptions : orderedOptions;
    return (
      <Flex alignItems="center" column className={styles.poll}>
        <Flex justifyContent="center" className={styles.topBar}>
          {hasAnswered ? (
            <Icon name="stats" className={styles.stats} />
          ) : (
            <div className={styles.notAnswered}>?</div>
          )}
          <Link to={`/polls/${id}`}>
            <Flex
              justifyContent="center"
              alignItems="center"
              className={styles.headerBar}
            >
              {title}
            </Flex>
          </Link>
        </Flex>
        <Flex
          column
          alignItems="center"
          className={styles.voteButtonWrapper}
          style={{
            height:
              expanded && this.optionsRef.current
                ? `${this.optionsRef.current.clientHeight}px`
                : '0px',
          }}
        >
          <div className={styles.voteButtonSubWrapper} ref={this.optionsRef}>
            {!hasAnswered && (
              <Flex
                column
                alignItems="center"
                className={styles.optionsWrapper}
              >
                {details && description}
                {options &&
                  optionsToShow.map((option) => (
                    <Button
                      key={option.id}
                      className={styles.voteButton}
                      onClick={() => handleVote(poll.id, option.id)}
                    >
                      {option.name}
                    </Button>
                  ))}
              </Flex>
            )}
            {hasAnswered && resultsHidden && (
              <Flex
                column
                alignItems="center"
                className={styles.optionsWrapper}
              >
                Resultatet er skjult
              </Flex>
            )}
            {hasAnswered && !resultsHidden && (
              <Flex
                column
                alignItems="center"
                className={styles.optionsWrapper}
              >
                <table className={styles.pollTable}>
                  <tbody>
                    {optionsToShow.map(({ id, name, votes, ratio }) => {
                      return (
                        <tr key={id}>
                          <td className={styles.textColumn}>{name}</td>
                          <td className={styles.graphColumn}>
                            {votes === 0 ? (
                              <span className={styles.noVotes}>
                                Ingen stemmer
                              </span>
                            ) : (
                              <div className={styles.fullGraph}>
                                <div
                                  style={{
                                    width: `${ratio}%`,
                                  }}
                                >
                                  <div className={styles.pollGraph}>
                                    {ratio >= 18 && <span>{`${ratio}%`}</span>}
                                  </div>
                                </div>
                                {ratio < 18 && (
                                  <span style={{ marginLeft: '2px' }}>
                                    {`${ratio}%`}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Flex>
            )}
            <div className={styles.totalVotes}>
              <Tooltip
                content="Avstemningen er anonym."
                renderDirection="right"
              >
                <Icon
                  name="information-circle-outline"
                  size={17}
                  style={{ cursor: 'pointer', margin: '0 5px' }}
                />
              </Tooltip>
              Stemmer: {totalVotes}
            </div>
          </div>
        </Flex>
        <Flex
          alignItems="flex-end"
          justifyContent="center"
          className={styles.bottomBar}
        >
          <Icon
            onClick={this.toggleTruncate}
            className={expanded ? styles.arrowUp : styles.arrowDown}
            size={20}
            name={expanded ? 'arrow-up' : 'arrow-down'}
          />
        </Flex>
      </Flex>
    );
  }
}

export default Poll;
