import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { MdDownloadForOffline } from 'react-icons/md';
import { AiTwotoneDelete } from 'react-icons/ai';
import { BsFillArrowUpRightCircleFill } from 'react-icons/bs';
//import { MdFavorite } from 'react-icons/md';
//import { MdSave } from 'react-icons/md';
//import logo from '../assets/logo.png';
import favicon from '../assets/favicon.png';

import { client, urlFor } from '../client';

const Pin = ({ pin }) => {
  const [postHovered, setPostHovered] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [likingPost, setLikingPost] = useState(false);
  
  const navigate = useNavigate();

  const { postedBy, title, pinDetail, image, _id, destination } = pin;

  const user = localStorage.getItem('user') !== 'undefined' ? 
  JSON.parse(localStorage.getItem('user')) : localStorage.clear();

  const deletePin = (id) => {
    client
      .delete(id)
      .then(() => {
        //window.location.reload();
      });
  };

  let alreadySaved = pin?.save?.filter((item) => item?.postedBy?._id === user?.googleId);

  alreadySaved = alreadySaved?.length > 0 ? alreadySaved : [];

  let alreadyLiked = pin?.like?.filter((item) => item?.postedBy?._id === user?.googleId);

  alreadyLiked = alreadyLiked?.length > 0 ? alreadyLiked : [];


  const savePin = (id) => {
    if (alreadySaved?.length === 0) {
      setSavingPost(true);

      client
        .patch(id)
        .setIfMissing({ save: [] })
        .insert('after', 'save[-1]', [{
          _key: uuidv4(),
          userId: user?.googleId,
          postedBy: {
            _type: 'postedBy',
            _ref: user?.googleId,
          },
        }])
        .commit()
        .then(() => {
          //window.location.reload();
          setSavingPost(false);
        });
    }
  };

  const likePin = (id) => {
    if (alreadyLiked?.length === 0) {
      setLikingPost(true);

      client
        .patch(id)
        .setIfMissing({ like: [] })
        .insert('after', 'like[-1]', [{
          _key: uuidv4(),
          userId: user?.googleId,
          postedBy: {
            _type: 'postedBy',
            _ref: user?.googleId,
          },
        }])
        .commit()
        .then(() => {
          //window.location.reload();
          setLikingPost(false);
        });
    }
  };

  return (
    <div className="m-2 mb-5">
      <Link to={`/user-profile/${postedBy?._id}`} className="flex gap-2 mt-2 
      mb-1 items-center ">
        <img
          className="w-10 h-10 rounded-full border-2 border-purple-500 
          border-opacity-100 object-cover"
          src={postedBy?.image}
          alt="user-profile"
          layout= "responsive"
          priority= "true"
        />
        <p className="font-semibold">{postedBy?.userName.replace(/\s+/g, '').toLowerCase()}</p>
        <img className="hidden" src={favicon} width="15px" alt="logo" style={{ marginLeft: '0px' }}/>
      </Link>
      <h1 className="text-1xl font-bold break-words ml-6 mb-2 sd:text-sm xs:text-sm 
      md:text-lg xl:text-lg">
        {pinDetail?.title}
      </h1>
      <div
        onMouseEnter={() => setPostHovered(true)}
        onMouseLeave={() => setPostHovered(false)}
        onClick={() => navigate(`/pin-detail/${_id}`)}
        className="relative cursor-zoom-in w-auto hover:shadow-lg
        rounded-lg overflow-hidden transition-all duration-500 ease-in-out"
      >
          {image && (
        <img className="rounded-lg w-full" src={(urlFor(image).width(250).url())} alt="user-post" /> )}
        {postHovered && (
          <div
            className="absolute top-0 w-full h-full flex flex-col justify-between p-1 pr-2 
            pt-2 pb-2 z-50"
            style={{ height: '100%' }}
          >
            <div className="flex items-center justify-start">
              <div className="flex gap-2">
                <a
                  href={`${image?.asset?.url}?dl=`}
                  download
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="bg-transparent border-2 border-white w-9 h-9 p-2 rounded-full flex items-center justify-center 
                  text-white text-xl opacity-75 hover:opacity-100 hover:shadow-md outline-none"
                ><MdDownloadForOffline />
                </a>
              </div>
              {alreadySaved?.length !== 0 ? (
                <button type="button" className="bg-transparent border-2 border-white opacity-70 hover:opacity-100
                 text-white font-bold px-5 py-1 mr-1 ml-1 text-xs md:text-sm rounded-3xl 
                 hover:shadow-md outline-none">
                  {pin?.save?.length}  Saved
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    savePin(_id);
                  }}
                  type="button"
                  className="bg-transparent border-2 border-white opacity-70 hover:opacity-100 text-white font-bold 
                  px-5 py-1 mr-1 ml-1 text-lg sd:text-sm md:text-sm rounded-3xl hover:shadow-md 
                  outline-none"
                >
                  {pin?.save?.length}   {savingPost ? 'Saving' : 'Save'}
                </button>
              )}
              {alreadyLiked?.length !== 0 ? (
                <button type="button" className="bg-transparent border-2 border-white opacity-70 hover:opacity-100
                 text-white font-bold px-5 py-1 text-lg sd:text-sm md:text-sm rounded-full 
                 hover:shadow-md outline-none">
                  {pin?.like?.length}  Liked
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    likePin(_id);
                  }}
                  type="button"
                  className="bg-transparent border-2 border-white opacity-70 hover:opacity-100 text-white font-bold 
                  px-5 py-1 text-lg sd:text-sm md:text-sm rounded-3xl hover:shadow-md outline-none"
                >
                  {pin?.like?.length}  {likingPost ? 'Liking' : 'Like'}
                  {/*<MdFavorite className='text-lg md:text-2xl' />*/}
                </button>
              )}
            </div>
            <div className=" flex justify-between items-center gap-2 w-full">
              {destination?.slice(8).length > 0 ? (
                <a
                  href={destination}
                  target="_blank"
                  className="bg-white flex items-center gap-2 text-black text-xs md:text-sm 
                  font-bold h-9 p-2 pl-4 pr-4 rounded-full opacity-70 hover:opacity-100 hover:shadow-md"
                  rel="noreferrer"
                >
                  {' '}
                  <BsFillArrowUpRightCircleFill />
                  {destination?.slice(8, 17)}...
                </a>
              ) : undefined}
              {
           postedBy?._id === user?.googleId && (
           <button
             type="button"
             onClick={(e) => {
               e.stopPropagation();
               deletePin(_id);
             }}
             className="bg-white p-2 rounded-full w-8 h-8 flex items-center justify-center text-dark 
             opacity-75 hover:opacity-100 outline-none"
           >
             <AiTwotoneDelete />
           </button>
           )
        }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pin;
