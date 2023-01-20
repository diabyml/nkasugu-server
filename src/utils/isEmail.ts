// program to validate an email address

export const isEmail = (email_id: string) => {
    const regex_pattern =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
    //   if (regex_pattern.test(email_id)) {
    //     // console.log("The email address is valid");
    //   } else {
    //     console.log("The email address is not valid");
    //   }
  
    return regex_pattern.test(email_id);
  };