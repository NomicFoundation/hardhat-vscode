pragma solidity ^0.4.6;

contract Quiz {
    struct Answer
    {
        bytes32 text; 
        uint voteCount; // number of accumulated votes
        // add more non-key fields as needed
    }

    struct Question
    {
        bytes32 text;
        bytes32[] answerList; // list of answer keys so we can look them up
        mapping(bytes32 => Answer) answerStructs; // random access by question key and answer key
        // add more non-key fields as needed
    }

    mapping(bytes32 => Question) questionStructs; // random access by question key
    bytes32[] questionList; // list of question keys so we can enumerate them

    function newQuestion(bytes32 questionKey, bytes32 text) 
        // onlyOwner
        returns(bool success)
    {
        // not checking for duplicates
        questionStructs[questionKey].text = text;
        questionList.push(questionKey);

        return true;
    }

    function getQuestion(bytes32 questionKey)
        public
        constant
        returns(bytes32 wording, uint answerCount)
    {
        return(questionStructs[questionKey].text, questionStructs[questionKey].answerList.length);
    }
}
