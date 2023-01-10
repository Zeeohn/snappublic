import React, { useEffect, useState } from 'react';
import { MdDownloadForOffline } from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import logo from '../assets/logo.png';
import logowhite2 from '../assets/logowhite2.png';
import { IoIosArrowBack } from 'react-icons/io';

import { client, urlFor } from '../client';
import MasonryLayout from './MasonryLayout';
import { pinDetailMorePinQuery, pinDetailQuery } from '../utils/data';
import Spinner from './Spinner';

const PinDetail = ({ user, data }) => {
  const { pinId } = useParams();
  const [pins, setPins] = useState();
  const [pinDetail, setPinDetail] = useState();
  const [comment, setComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [text, setText] = useState(data?.about.slice(0, 100));
  const [readMore, setReadMore] = useState(false);


  const navigate = useNavigate('/');

  const fetchPinDetails = () => {
    const query = pinDetailQuery(pinId);

    if (query) {
      client.fetch(`${query}`).then((data) => {
        setPinDetail(data[0]);
        console.log(data);
        if (data[0]) {
          const query1 = pinDetailMorePinQuery(data[0]);
          client.fetch(query1).then((res) => {
            setPins(res);
          });
        }
      });
    }
  };

  useEffect(() => {
    fetchPinDetails();
  }, [pinId]);

  const addComment = () => {
    if (comment) {
      setAddingComment(true);

      client
        .patch(pinId)
        .setIfMissing({ comments: [] })
        .insert('after', 'comments[-1]', [{ comment, _key: uuidv4(), postedBy: { _type: 'postedBy', _ref: user._id } }])
        .commit()
        .then(() => {
          fetchPinDetails();
          setComment('');
          setAddingComment(false);
        });
    }
  };

  if (!pinDetail) {
    return (
      <Spinner />
    );
  }

  return (
    <>
      {pinDetail && (
        <div className="flex xl:flex-row flex-col m-auton xl:shadow-md md:shadow-md 
        shadow-md rounded-3xl bg-white" style={{ maxWidth: '1000px', marginLeft: '1px' }}>
          {/*<IoIosArrowBack className="bg-transparent border-2 border-white
           text-white rounded-full w-8 h-8 -mb-10 ml-3 z-50" onClick={() => navigate('/')} />*/}
           <img src={logowhite2} alt="logo" className="bg-transparent font-bold
            w-8 h-8 -mb-10 ml-3 z-50 cursor-pointer" onClick={() => navigate('/')} />
          <div className="flex justify-center items-center md:items-start flex-initial">
            <img
              className="w-full rounded-t-2xl sd:rounded-lg md:rounded-t-2xl xl:rounded-t-2xl
              2xl:rounded-t-3xl xl:rounded-b-2xl xl:mt-3 xl:mb-3"
              src={(pinDetail?.image && urlFor(pinDetail?.image).url())}
              alt="user-post"
            />
          </div>
          <div className="w-full p-5 flex-1 xl:min-w-620">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <a
                  href={`${pinDetail.image.asset.url}?dl=`}
                  download
                  className="p-2 pl-0 text-xl rounded-full flex items-center justify-center text-dark 
                  opacity-75 hover:opacity-100"
                >
                  <MdDownloadForOffline />
                </a>
              </div>
              <a href={pinDetail.destination} target="_blank" rel="noreferrer" className="sd:text-sm xs:text-sm 
              md:text-sm xl:text-sm">
                {pinDetail.destination?.slice(0, 25)}
              </a>
            </div>
            <div>
            <Link to={`/user-profile/${pinDetail?.postedBy._id}`} className="flex gap-2 mt-1 items-center
             bg-white rounded-lg">
              <img
                className=" w-10 h-10 rounded-full border-2 border-purple-500 border-opacity-100 object-cover "
                src={user?.image}
                alt="user-profile"
                layout= "responsive"
                priority= "true"
              />
              <p className="text-gray-700 sd:text-lg xs:text-sm md:text-lg">{pinDetail?.postedBy.userName.replace(/\s+/g, '').toLowerCase()}</p>
              <img src={logo} width="70px" alt="logo" className="mr-1 sd:text-lg xs:text-sm md:text-lg" />
            </Link>
            <h1 className="text-lg 2xl:text-xl sd:text-sm xs:text-sm md:text-lg xl:text-lg font-bold break-words mt-3 display:inline">
              {pinDetail.title}
            </h1>
            <p className="lg:text-lg 2xl:text-xl xl:text-lg xs:text-sm md:text-lg sd:text-sm mt-3 display:inline">
              {pinDetail.about}
              {text}
              {!readMore && "..."}
            <div
              className="text-black font-semibold 2xl:text-lg xl:text-lg lg:text-sm md:text-lg sd:text-sm xs:text-sm cursor-pointer"
              onClick={() => {
              if (!readMore) {
               setText(data?.about);
               setReadMore(true);
              } else {
                 setText(data?.about.slice(0, 100));
                 setReadMore(false);
              }
            }}
            >
              {readMore ? " Show Less" : " Read More"}
            </div>
            </p>
            </div>
            <h2 className="mt-3 font-bold xs:text-sm md:text-lg sd:text-sm">Comments</h2>
            <div className="max-h-370 overflow-y-auto">
              {pinDetail?.comments?.slice(0, 1).map((item) => (
                <div className="flex gap-2 xl:text-lg xs:text-sm md:text-sm sd:text-sm mt-3 items-center bg-white 
                rounded-lg" key={item.comment}>
                  <Link to={`/user-profile/${user._id}`}>
                  <img
                    src={item.postedBy?.image}
                    className="w-10 h-10 rounded-full cursor-pointer border-2 border-purple-500 border-opacity-100"
                    alt="user-profile"
                  />
                  </Link>
                  <div className="flex flex-col">
                    <p className="font-bold sd:text-sm xs:text-sm md:text-lg">{item.postedBy?.userName.replace(/\s+/g, '').toLowerCase()}</p>
                    <p className="2xl:text-lg xl:text-lg lg:text-sm md:text-lg sd:text-sm ">{item.comment}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap mt-6 gap-3">
              <img src={user.image} className="w-10 h-10 rounded-full cursor-pointer border-2 border-purple-500" alt="user-profile" />
              <input
                className=" flex-1 border-gray-100 outline-none border-2 p-2 rounded-3xl focus:border-gray-300"
                type="text"
                placeholder="Add a comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="button"
                className="bg-red-500 text-white rounded-full px-6 py-2 font-semibold text-base xl:text-lg 
                sd:text-sm md:text-lg outline-none"
                onClick={addComment}
              >
                {addingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
      {pins?.length > 0 && (
        <h2 className="text-center font-bold xl:text-lg xs:text-sm md:text-lg sd:text-sm mt-8 mb-4">
          More catalogs for you
        </h2>
      )}
      {pins ? (
        <MasonryLayout pins={pins} />
      ) : (
        <Spinner />
      )}
    </>
  );
};

export default PinDetail;