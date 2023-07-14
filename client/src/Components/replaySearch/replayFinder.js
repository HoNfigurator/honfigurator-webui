import React, { useState } from 'react';
import { Input, Button, Table, Typography } from 'antd';

const { Search } = Input;

const teamMapping = (teamNumber) => {
  switch (teamNumber) {
    case '1':
      return 'Legion';
    case '2':
      return 'Hellbourne';
    default:
      return 'Unknown';
  }
};

const columns = [
  {
    title: 'Server Name',
    dataIndex: 'name',
  },
  {
    title: 'Match ID',
    dataIndex: 'match_id',
  },
  {
    title: 'Match Time',
    dataIndex: 'date',
  },
  {
    title: 'Winner',
    dataIndex: 'winning_team',
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
  },
  {
    title: 'Download',
    dataIndex: 's3_url',
    render: (text, record) => <a href={record.s3_url} target="_blank" rel="noopener noreferrer">Download</a>,
  },
];

const GameReplaysSearchPage = () => {
  const [loading, setLoading] = useState(false);
  const [replays, setReplays] = useState([]);

  const onSearch = async (matchId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api-ui/get_match_stats/${matchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
        },
      });
      const rawData = await response.json();

      //extract match summary from raw data
      const data = rawData["match_summ"];

      const replaysWithId = Object.values(data).map((matchData, index) => {
        // Remove fractional seconds
        const dateTimeParts = matchData['time'].split('.');
        const timeWithoutFractionalSeconds = dateTimeParts[0];
      
        // Create Date object
        const dateObject = new Date(`${matchData['date']} ${timeWithoutFractionalSeconds}`);
      
        // Format Date object to desired format
        const formattedDate = dateObject.toLocaleDateString();
        const formattedTime = dateObject.toLocaleTimeString();
      
        // Convert duration to HH:MM:SS format
        const durationSeconds = matchData['time_played'];
        const duration = new Date(durationSeconds * 1000).toISOString().substr(11, 8);

        return {
          key: index,
          name: matchData['name'],
          match_id: matchData['match_id'],
          date: `${formattedDate} ${formattedTime}`,
          winning_team: teamMapping(matchData['winning_team']),
          duration: duration,
          s3_url: matchData['s3_url'],  // Add s3_url to data
        };
      });

      setReplays(replaysWithId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Search
        placeholder="Enter Match ID"
        enterButton="Search"
        size="large"
        onSearch={onSearch}
      />
      <Table
        columns={columns}
        dataSource={replays}
        loading={loading}
      />
    </div>
  );
};

export default GameReplaysSearchPage;
