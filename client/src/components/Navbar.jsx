import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMdAdd, IoMdSearch } from 'react-icons/io';

const Navbar = ({ searchTerm, setSearchTerm, user }) => {
  const navigate = useNavigate();

  if(!user) return null;
  
  return (
    <div className="flex gap-2 md:gap-5 w-full mt-5 pb-7">
      <div className="flex justify-start items-center w-full 
      px-2 rounded-3xl bg-white border-none outline-none 
      focus-within:shadow-sm">
        <IoMdSearch fontSize={21} className="ml-1" />
        <input 
          type="text"
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search photo & video catalogs"
          value={searchTerm}
          onFocus={() => navigate('/search')}
          className="p-2 w-full sd:text-lg xs:text-sm bg-white outline-none"
        />
      </div>
      <div className="flex gap-3">
        <Link to='create-pin' className="bg-black text-white 
        text-2xl rounded-full w-10 h-10 md:w-14 md:h-12 flex 
        justify-center items-center">
          <IoMdAdd />
        </Link>
        <Link to={`user-profile/${user?._id}`} className="hidden md:block">
          <img src={user?.image} alt="user" className="w-14 h-12
          rounded-full border-2 border-purple-500 border-opacity-100" />
        </Link>
      </div>
    </div> 
  )
}

export default Navbar;