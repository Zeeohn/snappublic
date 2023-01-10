import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { client } from '../client';
import { feedQuery, searchQuery } from '../utils/data';
import MasonryLayout from './MasonryLayout';
//import Spinner from './Spinner';
import favicon from '../assets/favicon.png';


const Feed = () => {
  const [loading, setLoading] = useState(false);
  const [pins, setPins] = useState(null);
  const { catalogId } = useParams();

  useEffect(() => {
    setLoading(true);

    if(catalogId) {
      const query = searchQuery(catalogId);

      client.fetch(query)
        .then((data) => {
          setPins(data);
          setLoading(false);
        })
    } else {
      client.fetch(feedQuery)
       .then((data) => {
        setPins(data);
        setLoading(false);
       })
    }
  }, [catalogId])

  //{/*if(loading) return <Spinner />*/}//

  if(loading) return <img src={favicon} alt="logo" style={{ width: '80px', 
  paddingRight: '10px', paddingLeft: '10px', 
  marginLeft: '155px', marginRight: '150px', marginTop: '215px' }} 
  className="flex flex-col justify-center items-center ml-155 mr-150
  mt-215 w-60 h-90"/>


  if(!pins?.length) return <h2>No catalog found. Please try again</h2>
  
  return (
    <div>
      {pins && <MasonryLayout pins={pins} />}
    </div>
  )
}

export default Feed;