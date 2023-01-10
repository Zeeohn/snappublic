import React from 'react';
import * as Loader from 'react-loader-spinner';

function Spinner({ message }) {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full">
      <Loader.ThreeDots
        type="ThreeDots"
        color="red"
        height={500}
        width={200}
        className="m-5"
      />
      <p className="text-lg 2xl:text-xl md:text-lg sd:text-sm text-center px-2">{message}</p>
    </div>
  );
}

export default Spinner;




 