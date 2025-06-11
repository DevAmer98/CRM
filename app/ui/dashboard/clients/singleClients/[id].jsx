/*import { fetchClient } from "@/app/lib/data";
import styles from '@/app/ui/dashboard/clients/singleClients/singleClients.module.css';
import Image from "next/image";
import { GetServerSideProps } from "next";



const SingleClient = async ({client}) => {
    /*const {id} = params;
    const client = await fetchClient(id);*/
   /* return (
      <div className={styles.container}>
          <div className={styles.infoContainer}>
              <div className={styles.imgContainer}>
                  <Image src='/noavatar.png' alt='' fill />
              </div>
              {client.name}
          </div>
          <div className={styles.formContainer}>
              <form action={updateClient} className={styles.form}>
              <input type='hidden' name='id' value={client.id}/>
              <label>Name</label>
              <input type='text' name='name' placeholder={client.name}/>
              <label>Phone</label>
              <input type='text' name='phone' placeholder={client.phone} />
              <label>Contact Name</label>
              <input type='text' name='contactName' placeholder={client.contactName} />
              <label>Contact Mobile</label>
              <input type='text' name='contactMobile' placeholder={client.contactMobile} />
              <label>Email</label>
              <input type='email' name='email' placeholder={client.email} />
              <label>Address</label>
              <textarea type='text' name='address' placeholder={client.address} />
              <button className={styles.button}>Update</button>
              </form>
          </div>
      </div>
    );
  };
  
  export default SingleClient
  
  
  
export const getServerSideProps = async (context) => {
  const { id } = context.params;
  try {
    const client = await fetchClient(id);
    return { props: { client } };
  } catch (err) {
    console.error("Failed to fetch client:", err);
    return { props: { client: null, error: "Failed to fetch Client" } };
  }
};*/