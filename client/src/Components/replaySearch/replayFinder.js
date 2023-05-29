import React, { useState } from 'react';
import { Input, Button, Table } from 'antd';


const { Search } = Input;

const columns = [
  {
    title: 'Match ID',
    dataIndex: 'match_id',
  },
  {
    title: 'Server',
    dataIndex: 'server',
  },
  {
    title: 'Path',
    dataIndex: 'path',
  },
  {
    title: 'File Size',
    dataIndex: 'file_size',
  },
  {
    title: 'Creation Time',
    dataIndex: 'creation_time',
  },
];


const GameReplaysSearchPage = () => {
  const [loading, setLoading] = useState(false);
  const [replays, setReplays] = useState([]);

  const onSearch = async (matchId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/get_replay/${matchId}`, {
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
          }
      });
      const data = await response.json();

      // If the data is an array, each item should include a 'match_id' property
      const replaysWithId = data.map((item, index) => ({
        ...item,
        matchId: item.error ? `Error: ${item.error.detail}` : matchId
      }));

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
