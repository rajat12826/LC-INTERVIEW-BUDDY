import { dodopayments } from "./dodopayments";

async function listProducts() {
    try {
        const products=await dodopayments.products.list()
      
        
    } catch (error) {
        console.log(error);
        
    }
}
listProducts()