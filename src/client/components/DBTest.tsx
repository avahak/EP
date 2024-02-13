/**
 * Tietokannan testausta.
 */

import { testFaker } from "../../shared/dbFaker";

const DBTest: React.FC = () => {
    const { name, email } = testFaker();
    return (
        <div>
        {name}
        <br />
        {email}
        </div>
    );
}

export { DBTest };